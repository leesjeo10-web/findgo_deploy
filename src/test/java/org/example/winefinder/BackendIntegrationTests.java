package org.example.winefinder;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.Map;
import javax.imageio.ImageIO;
import java.time.Instant;
import org.example.winefinder.auth.*;
import org.example.winefinder.config.SecurityConfig;
import org.example.winefinder.image.ImageRepository;
import org.example.winefinder.item.repository.ItemRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class BackendIntegrationTests {
    static final Path UPLOADS;
    static {
        try { UPLOADS = Files.createTempDirectory("findgo-test-images-"); }
        catch (Exception e) { throw new ExceptionInInitializerError(e); }
    }
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) { registry.add("app.upload-dir", () -> UPLOADS.toString()); }
    @Autowired WebApplicationContext context;
    @Autowired ObjectMapper json;
    @Autowired MemberRepository members;
    @Autowired ItemRepository items;
    @Autowired ImageRepository images;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtService jwt;
    @Autowired JwtEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired org.example.winefinder.image.ImageService imageService;
    MockMvc mvc;

    @BeforeEach
    void setup() throws Exception {
        images.deleteAll(); items.deleteAll(); members.deleteAll();
        try (var files = Files.list(UPLOADS)) { for (Path file : files.toList()) Files.deleteIfExists(file); } // 테스트마다 사진 폴더 비우기
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @AfterAll
    static void cleanup() throws Exception {
        try (var paths = Files.walk(UPLOADS)) {
            for (Path path : paths.sorted(java.util.Comparator.reverseOrder()).toList()) Files.deleteIfExists(path);
        }
    }
    // Authorization: Bearer {토큰} 헤더를 붙입니다.
    private AbstractMockHttpServletRequestBuilder<?> secured(AbstractMockHttpServletRequestBuilder<?> request, String token) {
        return request.header("Authorization", "Bearer " + token);
    }
    // DB에 회원을 만들고 그 회원의 토큰을 발급합니다. (비밀번호: password123!)
    private String tokenOf(String loginId, Role role) {
        var member = members.saveAndFlush(new Member(loginId, "테스트 학생", passwords.encode("password123!"), role, role == Role.STUDENT));
        return jwt.issue(member);
    }
    private String student(String loginId) { return tokenOf(loginId, Role.STUDENT); }
    private String itemBody(String type, String name, String imageUrl) {
        return json.writeValueAsString(Map.of("type", type, "name", name, "description", "물품 특징", "location", "도서관",
                "storageLocation", "학생회실", "lostFoundAt", LocalDate.now().toString(), "status", "OPEN", "imageUrl", imageUrl));
    }
    private long createItem(String token, String type, String name, String imageUrl) throws Exception {
        var response = mvc.perform(secured(post("/api/items"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(itemBody(type, name, imageUrl)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.userId").isNumber())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }

    @Test
    void ownerCanManageItemsButOtherMemberCannot() throws Exception {
        var owner = student("1101");
        var other = student("1102");
        long id = createItem(owner, "LOST", "우산", "");
        mvc.perform(secured(get("/api/me/items"), owner)).andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(secured(get("/api/me/items"), other)).andExpect(jsonPath("$.content.length()").value(0));
        mvc.perform(secured(put("/api/items/" + id), other).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("FOUND", "변경", ""))).andExpect(status().isForbidden());
        mvc.perform(secured(delete("/api/items/" + id), other)).andExpect(status().isForbidden());
        mvc.perform(secured(patch("/api/items/" + id + "/status"), other).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RESOLVED\"}")).andExpect(status().isForbidden());
        mvc.perform(secured(put("/api/items/" + id), owner).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("FOUND", "검정 우산", ""))).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("검정 우산"));
        mvc.perform(secured(patch("/api/items/" + id + "/status"), owner).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RESOLVED\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESOLVED"));
        mvc.perform(secured(delete("/api/items/" + id), owner)).andExpect(status().isNoContent());
        mvc.perform(secured(get("/api/items/" + id), owner)).andExpect(status().isNotFound());
    }
    @Test
    void searchFiltersSortingAndRecommendations() throws Exception {
        var s = student("1101");
        long first = createItem(s, "LOST", "검정 우산", "");
        long second = createItem(s, "FOUND", "검정 우산 50%_!", "");
        createItem(s, "FOUND", "파랑 가방", "");
        mvc.perform(secured(get("/api/items").param("keyword", "50%_!").param("type", "FOUND").param("status", "OPEN"), s))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(second));
        mvc.perform(secured(get("/api/items").param("sort", "oldest").param("size", "1"), s))
                .andExpect(jsonPath("$.content[0].id").value(first)).andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(secured(get("/api/items").param("keyword", "도서관"), s)).andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(secured(get("/api/items/similar").param("name", "검정 우산").param("type", "LOST"), s))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(second)).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(secured(get("/api/items").param("size", "101"), s)).andExpect(status().isBadRequest());
        mvc.perform(secured(get("/api/items").param("sort", "invalid"), s)).andExpect(status().isBadRequest());
    }
    @Test
    void listIsSortedByCreatedAtAndHasNoWriterInfoButDetailHasIt() throws Exception {
        String writer = student("1101");
        var member = members.findByLoginId("1101").orElseThrow();
        mvc.perform(secured(patch("/api/auth/me"), writer).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"01012345678\"}"));
        long older = createItem(writer, "LOST", "먼저 쓴 글", "");
        long newer = createItem(writer, "LOST", "나중에 쓴 글", "");
        // id는 older가 작지만 등록 일시를 더 늦게 바꾸면 latest에서 먼저 나와야 합니다.
        jdbc.update("update items set created_at = ? where id = ?", java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().plusMinutes(5)), older);
        jdbc.update("update items set created_at = ? where id = ?", java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusMinutes(5)), newer);

        String reader = student("1102");
        mvc.perform(secured(get("/api/items"), reader)).andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(older))
                .andExpect(jsonPath("$.content[1].id").value(newer))
                .andExpect(jsonPath("$.content[0].userId").value(member.getId()))
                .andExpect(jsonPath("$.content[0].userName").doesNotExist())
                .andExpect(jsonPath("$.content[0].userPhone").doesNotExist());
        mvc.perform(secured(get("/api/items").param("sort", "oldest"), reader))
                .andExpect(jsonPath("$.content[0].id").value(newer));
        mvc.perform(secured(get("/api/me/items"), writer))
                .andExpect(jsonPath("$.content[0].id").value(older))
                .andExpect(jsonPath("$.content[0].userPhone").doesNotExist());

        mvc.perform(secured(get("/api/items/" + older), reader)).andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(member.getId()))
                .andExpect(jsonPath("$.userName").value("테스트 학생"))
                .andExpect(jsonPath("$.userPhone").value("010-1234-5678"))
                .andExpect(jsonPath("$.userOfficePhone").isEmpty());
        // 전화번호가 없으면 null
        long noPhone = createItem(reader, "FOUND", "우산", "");
        mvc.perform(secured(get("/api/items/" + noPhone), writer))
                .andExpect(jsonPath("$.userName").value("테스트 학생"))
                .andExpect(jsonPath("$.userPhone").isEmpty());
    }
    @Test
    void adminCanDeleteStudentItemButCannotEditIt() throws Exception {
        String owner = student("1101");
        String admin = tokenOf("admin", Role.ADMIN);
        long id = createItem(owner, "FOUND", "우산", "");
        mvc.perform(secured(put("/api/items/" + id), admin).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("FOUND", "관리자 수정", ""))).andExpect(status().isForbidden());
        mvc.perform(secured(patch("/api/items/" + id + "/status"), admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RESOLVED\"}")).andExpect(status().isForbidden());
        mvc.perform(secured(get("/api/items/" + id), owner))
                .andExpect(jsonPath("$.name").value("우산")).andExpect(jsonPath("$.status").value("OPEN"));
        mvc.perform(secured(delete("/api/items/" + id), admin)).andExpect(status().isNoContent());
        assertFalse(items.existsById(id));
        mvc.perform(secured(delete("/api/items/" + id), admin)).andExpect(status().isNotFound());
    }
    private String studentBody(String loginId, String name, String password) {
        var body = new java.util.HashMap<String, String>();
        body.put("loginId", loginId); body.put("name", name); body.put("password", password);
        return json.writeValueAsString(body);
    }
    @Test
    void adminListsStudentsWithoutAdminInLoginIdOrder() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        members.saveAndFlush(new Member("1203", "다학생", "{noop}x", Role.STUDENT, true));
        members.saveAndFlush(new Member("1101", "가학생", "{noop}x", Role.STUDENT, true));
        members.saveAndFlush(new Member("1109", "나학생", "{noop}x", Role.STUDENT, false));
        mvc.perform(secured(get("/api/admin/members"), admin)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].loginId").value("1101"))
                .andExpect(jsonPath("$[1].loginId").value("1109"))
                .andExpect(jsonPath("$[2].loginId").value("1203"))
                .andExpect(jsonPath("$[0].name").value("가학생"))
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[0].phone").doesNotExist());
    }
    @Test
    void adminAddsStudentWhoMustChangePassword() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        mvc.perform(secured(post("/api/admin/members"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content(studentBody(" 1109 ", " 김민수 ", "initial-pass")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.loginId").value("1109"))
                .andExpect(jsonPath("$.name").value("김민수"))
                .andExpect(jsonPath("$.password").doesNotExist());
        var saved = members.findByLoginId("1109").orElseThrow();
        assertEquals(Role.STUDENT, saved.getRole());
        assertTrue(saved.isMustChangePassword());
        assertNull(saved.getPhone()); // 전화번호를 비우면 학생이 첫 로그인 때 입력

        // 전화번호를 함께 넣을 수도 있습니다.
        mvc.perform(secured(post("/api/admin/members"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"1110\",\"name\":\"이영희\",\"phone\":\"01055556666\",\"password\":\"initial-pass\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.phone").doesNotExist());
        assertEquals("010-5555-6666", members.findByLoginId("1110").orElseThrow().getPhone());
        mvc.perform(secured(post("/api/admin/members"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"1111\",\"name\":\"박철수\",\"phone\":\"123\",\"password\":\"initial-pass\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("전화번호 형식을 확인해 주세요."));
        assertFalse(members.existsByLoginId("1111"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("1109", "initial-pass")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.mustChangePassword").value(true));

        mvc.perform(secured(post("/api/admin/members"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content(studentBody("1109", "다른 학생", "initial-pass")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("이미 등록된 아이디입니다."));
        mvc.perform(secured(post("/api/admin/members"), student("1201")).contentType(MediaType.APPLICATION_JSON)
                        .content(studentBody("1301", "학생", "initial-pass")))
                .andExpect(status().isForbidden());
        assertFalse(members.existsByLoginId("1301"));
    }
    @Test
    void addStudentValidatesLoginIdNameAndPassword() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        String[][] cases = {
                {"261109", "김민수", "initial-pass", "아이디는 숫자 4자리로 입력해주세요."},
                {"abcd", "김민수", "initial-pass", "아이디는 숫자 4자리로 입력해주세요."},
                {"admin", "김민수", "initial-pass", "아이디는 숫자 4자리로 입력해주세요."},
                {"  ", "김민수", "initial-pass", "아이디를 입력해주세요."},
                {"1109", "   ", "initial-pass", "이름을 입력해주세요."},
                {"1109", "가".repeat(41), "initial-pass", "이름은 40자 이하로 입력해주세요."},
                {"1109", "김민수", null, "비밀번호를 입력해주세요."},
                {"1109", "김민수", "short7!", "비밀번호는 8~64자로 입력해주세요."},
                {"1109", "김민수", "a".repeat(65), "비밀번호는 8~64자로 입력해주세요."}};
        for (String[] c : cases) {
            mvc.perform(secured(post("/api/admin/members"), admin).contentType(MediaType.APPLICATION_JSON)
                            .content(studentBody(c[0], c[1], c[2])))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(c[3]));
        }
        assertEquals(1, members.count()); // admin만 있음
    }
    // 10x10 PNG를 올리고 imageUrl을 돌려줍니다.
    private String upload(String token) throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB), "png", bytes);
        var response = mvc.perform(secured(multipart("/api/images")
                        .file(new MockMultipartFile("file", "photo.png", "image/png", bytes.toByteArray())), token))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("imageUrl").asText();
    }
    private String fileName(String url) { return url.substring("/api/images/".length()); }
    private boolean photoExists(String url) { return Files.exists(UPLOADS.resolve(fileName(url))) || images.existsById(fileName(url)); }

    @Test
    void oldPhotoIsRemovedWhenItemIsDeletedOrPhotoChangedOrCleared() throws Exception {
        String owner = student("1101");
        String first = upload(owner), second = upload(owner), shared = upload(owner);
        long id = createItem(owner, "FOUND", "우산", first);
        // 사진 교체 → 예전 사진 삭제
        mvc.perform(secured(put("/api/items/" + id), owner).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("FOUND", "우산", second))).andExpect(status().isOk());
        assertFalse(photoExists(first));
        assertTrue(Files.exists(UPLOADS.resolve(fileName(second))));
        // 사진 비우기 → 삭제
        mvc.perform(secured(put("/api/items/" + id), owner).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("FOUND", "우산", ""))).andExpect(status().isOk());
        assertFalse(photoExists(second));
        // 물품 삭제 → 사진 삭제. 같은 사진을 쓰는 다른 물품이 있으면 남깁니다.
        long a = createItem(owner, "FOUND", "가방", shared);
        long b = createItem(owner, "LOST", "가방", shared);
        mvc.perform(secured(delete("/api/items/" + a), owner)).andExpect(status().isNoContent());
        assertTrue(Files.exists(UPLOADS.resolve(fileName(shared))) && images.existsById(fileName(shared)));
        mvc.perform(secured(delete("/api/items/" + b), owner)).andExpect(status().isNoContent());
        assertFalse(photoExists(shared));
        // 관리자가 지워도 사진이 정리됩니다.
        String third = upload(owner);
        long c = createItem(owner, "FOUND", "필통", third);
        mvc.perform(secured(delete("/api/items/" + c), tokenOf("admin", Role.ADMIN))).andExpect(status().isNoContent());
        assertFalse(photoExists(third));
    }
    @Test
    void unlinkedPhotosAreDeletedThreeHoursAfterUpload() throws Exception {
        String owner = student("1101");
        String unlinked = upload(owner), linked = upload(owner);
        createItem(owner, "FOUND", "우산", linked);
        // 아직 3시간이 지나지 않았으면 남깁니다.
        assertEquals(0, imageService.deleteUnlinkedImages(Instant.now().plus(java.time.Duration.ofHours(2))));
        assertTrue(photoExists(unlinked));
        // 3시간이 지나면 연결되지 않은 사진만 지웁니다.
        assertEquals(1, imageService.deleteUnlinkedImages(Instant.now().plus(java.time.Duration.ofHours(3).plusMinutes(1))));
        assertFalse(photoExists(unlinked));
        assertTrue(Files.exists(UPLOADS.resolve(fileName(linked))) && images.existsById(fileName(linked)));
    }
    @Test
    void adminResetsStudentPasswordButNotAdminPassword() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        long adminId = members.findByLoginId("admin").orElseThrow().getId();
        var studentMember = members.saveAndFlush(new Member("1109", "김민수", passwords.encode("old-password"), Role.STUDENT, false));
        String url = "/api/admin/members/" + studentMember.getId() + "/password";
        mvc.perform(secured(patch(url), admin).contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"short\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("비밀번호는 8~64자로 입력해주세요."));
        mvc.perform(secured(patch(url), admin).contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"reset-password\"}"))
                .andExpect(status().isNoContent());
        var reset = members.findById(studentMember.getId()).orElseThrow();
        assertTrue(reset.isMustChangePassword());
        assertTrue(passwords.matches("reset-password", reset.getPasswordHash()));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("1109", "reset-password")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.mustChangePassword").value(true));

        mvc.perform(secured(patch("/api/admin/members/" + adminId + "/password"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"reset-password\"}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.message").value("관리자 계정의 비밀번호는 화면에서 변경할 수 없습니다."));
        assertTrue(passwords.matches("password123!", members.findById(adminId).orElseThrow().getPasswordHash()));
        mvc.perform(secured(patch("/api/admin/members/999999/password"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"reset-password\"}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("해당 학생을 찾을 수 없습니다."));
        mvc.perform(secured(patch(url), student("1201")).contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"reset-password\"}"))
                .andExpect(status().isForbidden());
    }
    @Test
    void deletingStudentRemovesItemsAndPhotosButAdminIsProtected() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        long adminId = members.findByLoginId("admin").orElseThrow().getId();
        String target = student("1101");
        long targetId = members.findByLoginId("1101").orElseThrow().getId();
        String other = student("1102");
        String attached = upload(target), notAttached = upload(target), othersPhoto = upload(other);
        createItem(target, "FOUND", "우산", attached);
        createItem(target, "LOST", "필통", "");
        long othersItem = createItem(other, "LOST", "가방", othersPhoto);

        mvc.perform(secured(delete("/api/admin/members/" + targetId), admin)).andExpect(status().isNoContent());
        assertFalse(members.existsById(targetId));
        assertEquals(1, items.count());
        assertTrue(items.existsById(othersItem));
        assertFalse(photoExists(attached));
        assertFalse(photoExists(notAttached));
        assertTrue(Files.exists(UPLOADS.resolve(fileName(othersPhoto))) && images.existsById(fileName(othersPhoto)));
        // 삭제된 학생의 토큰은 401
        mvc.perform(secured(get("/api/auth/me"), target)).andExpect(status().isUnauthorized());

        mvc.perform(secured(delete("/api/admin/members/" + adminId), admin))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.message").value("관리자 계정은 삭제할 수 없습니다."));
        assertTrue(members.existsById(adminId));
        mvc.perform(secured(delete("/api/admin/members/" + targetId), admin))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("해당 학생을 찾을 수 없습니다."));
        long otherId = members.findByLoginId("1102").orElseThrow().getId();
        mvc.perform(secured(delete("/api/admin/members/" + otherId), other)).andExpect(status().isForbidden());
        assertTrue(members.existsById(otherId));
    }
    @Test
    void homeApiIsRemoved() throws Exception {
        mvc.perform(secured(get("/api/home"), student("1101"))).andExpect(status().isNotFound());
    }
    @Test
    void uploadReencodesImageAndChecksOwnership() throws Exception {
        var owner = student("1101");
        var other = student("1102");
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB), "png", bytes);
        var request = multipart("/api/images").file(new MockMultipartFile("file", "../photo.png", "image/png", bytes.toByteArray()));
        var response = mvc.perform(secured(request, owner)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String url = json.readTree(response).get("imageUrl").asText();
        mvc.perform(get(url)).andExpect(status().isUnauthorized()); // 사진도 토큰이 필요
        mvc.perform(secured(get(url), other)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_JPEG));
        createItem(owner, "FOUND", "우산", url);
        mvc.perform(secured(post("/api/items"), other).contentType(MediaType.APPLICATION_JSON).content(itemBody("LOST", "우산", url)))
                .andExpect(status().isForbidden());
        mvc.perform(secured(multipart("/api/images").file(new MockMultipartFile("file", "fake.png", "image/png", "invalid".getBytes())), owner))
                .andExpect(status().isBadRequest());
        mvc.perform(secured(post("/api/items"), owner).contentType(MediaType.APPLICATION_JSON)
                .content(itemBody("LOST", "우산", "https://example.com/pic.png"))).andExpect(status().isBadRequest());
    }
    private String login(String loginId, String password) {
        return json.writeValueAsString(Map.of("loginId", loginId, "password", password));
    }
    @Test
    void loginReturnsTokenAndUserThatWorksForMe() throws Exception {
        tokenOf("1109", Role.STUDENT);
        var response = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(" 1109 ", "password123!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.loginId").value("1109"))
                .andExpect(jsonPath("$.user.name").value("테스트 학생"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.mustChangePassword").value(true))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String token = json.readTree(response).get("accessToken").asText();
        mvc.perform(secured(get("/api/auth/me"), token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.loginId").value("1109"));
    }
    @Test
    void loginFailureDoesNotRevealWhichFieldIsWrong() throws Exception {
        tokenOf("1109", Role.STUDENT);
        String message = "아이디 또는 비밀번호가 올바르지 않습니다. 다시 입력해주세요.";
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("1109", "wrong-password")))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value(message));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("9999", "password123!")))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value(message));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("  ", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(2));
    }
    @Test
    void meReturnsMemberOfTokenWithoutSession() throws Exception {
        String token = student("1109");
        var result = mvc.perform(secured(get("/api/auth/me"), token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.loginId").value("1109"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.phone").isEmpty())
                .andExpect(jsonPath("$.officePhone").isEmpty())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(header().doesNotExist("Set-Cookie")).andReturn();
        assertNull(result.getRequest().getSession(false)); // STATELESS: 세션을 만들지 않음
    }
    private String passwordBody(String current, String next) {
        return json.writeValueAsString(Map.of("currentPassword", current, "newPassword", next));
    }
    @Test
    void studentChangesPasswordAndMustChangePasswordBecomesFalse() throws Exception {
        String token = student("1109");
        mvc.perform(secured(patch("/api/auth/me/password"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody("password123!", "new-password-1")))
                .andExpect(status().isNoContent());
        mvc.perform(secured(get("/api/auth/me"), token)).andExpect(jsonPath("$.mustChangePassword").value(false));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("1109", "new-password-1")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.mustChangePassword").value(false));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("1109", "password123!")))
                .andExpect(status().isUnauthorized());
    }
    @Test
    void passwordChangeRejectsWrongCurrentBadLengthAndAdmin() throws Exception {
        String token = student("1109");
        mvc.perform(secured(patch("/api/auth/me/password"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody("wrong-password", "new-password-1")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("현재 비밀번호가 올바르지 않습니다."));
        for (String bad : new String[]{"short7!", "a".repeat(65)}) {
            mvc.perform(secured(patch("/api/auth/me/password"), token).contentType(MediaType.APPLICATION_JSON)
                            .content(passwordBody("password123!", bad)))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("비밀번호는 8~64자로 입력해주세요."));
        }
        mvc.perform(secured(patch("/api/auth/me/password"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody("password123!", "a".repeat(64))))
                .andExpect(status().isNoContent());

        String admin = tokenOf("admin", Role.ADMIN);
        mvc.perform(secured(patch("/api/auth/me/password"), admin).contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody("password123!", "new-password-1")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.message").value("관리자 계정의 비밀번호는 화면에서 변경할 수 없습니다."));
        assertTrue(passwords.matches("password123!", members.findByLoginId("admin").orElseThrow().getPasswordHash()));

        mvc.perform(patch("/api/auth/me/password").contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody("password123!", "new-password-1")))
                .andExpect(status().isUnauthorized());
    }
    private org.springframework.test.web.servlet.ResultActions patchMe(String token, String body) throws Exception {
        return mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content(body));
    }
    @Test
    void phoneIsNormalizedAndCannotBeDeleted() throws Exception {
        String token = student("1109");
        patchMe(token, "{\"phone\":\"01012345678\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.loginId").value("1109"))
                .andExpect(jsonPath("$.phone").value("010-1234-5678"))
                .andExpect(jsonPath("$.officePhone").isEmpty())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        patchMe(token, "{\"phone\":\"123\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("전화번호 형식을 확인해 주세요."));
        // 전화번호는 지울 수 없습니다.
        for (String body : new String[]{"{\"phone\":\"\"}", "{\"phone\":\"  \"}", "{\"phone\":null}", "{}"}) {
            patchMe(token, body).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("전화번호를 입력해주세요."));
        }
        assertEquals("010-1234-5678", members.findByLoginId("1109").orElseThrow().getPhone());
        // 학생이 보낸 교무실 번호는 무시합니다.
        patchMe(token, "{\"phone\":\"010-9876-5432\",\"officePhone\":\"02-123-4567\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.phone").value("010-9876-5432"))
                .andExpect(jsonPath("$.officePhone").isEmpty());
        mvc.perform(patch("/api/auth/me").contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"01012345678\"}"))
                .andExpect(status().isUnauthorized());
    }
    @Test
    void adminRegistersOfficeAndMobilePhoneAndBothShowOnAdminItem() throws Exception {
        String admin = tokenOf("admin", Role.ADMIN);
        patchMe(admin, "{\"phone\":\"01011112222\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("교무실 번호를 입력해주세요."));
        patchMe(admin, "{\"phone\":\"01011112222\",\"officePhone\":\"010-1234-5678\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("교무실 번호 형식을 확인해 주세요."));
        patchMe(admin, "{\"officePhone\":\"021234567\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("전화번호를 입력해주세요."));
        assertNull(members.findByLoginId("admin").orElseThrow().getPhone());
        patchMe(admin, "{\"phone\":\"01011112222\",\"officePhone\":\"021234567\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("010-1111-2222"))
                .andExpect(jsonPath("$.officePhone").value("02-123-4567"));
        patchMe(admin, "{\"phone\":\"01011112222\",\"officePhone\":\"031-1234-5678\"}")
                .andExpect(jsonPath("$.officePhone").value("031-1234-5678"));
        mvc.perform(secured(get("/api/auth/me"), admin)).andExpect(jsonPath("$.officePhone").value("031-1234-5678"));

        long adminItem = createItem(admin, "FOUND", "교무실 보관 우산", "");
        String reader = student("1101");
        mvc.perform(secured(get("/api/items/" + adminItem), reader)).andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value("테스트 학생"))
                .andExpect(jsonPath("$.userPhone").value("010-1111-2222"))
                .andExpect(jsonPath("$.userOfficePhone").value("031-1234-5678"));
        mvc.perform(secured(get("/api/items"), reader))
                .andExpect(jsonPath("$.content[0].userOfficePhone").doesNotExist());
    }
    @Test
    void tokenIsRequiredAndExpiredTokenHasOwnMessage() throws Exception {
        mvc.perform(get("/api/items")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_REQUIRED));
        mvc.perform(get("/api/items/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/items/similar").param("name", "우산").param("type", "LOST")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/items")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(itemBody("LOST", "우산", "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(secured(get("/api/items"), "not-a-jwt")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_REQUIRED));

        var member = members.saveAndFlush(new Member("1101", "학생", passwords.encode("password123!"), Role.STUDENT, true));
        var claims = JwtClaimsSet.builder().subject(String.valueOf(member.getId())).claim("role", "STUDENT")
                .issuedAt(Instant.now().minusSeconds(7200)).expiresAt(Instant.now().minusSeconds(3600)).build();
        String expired = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        mvc.perform(secured(get("/api/items"), expired)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_EXPIRED));
    }
    @Test
    void validTokenOfDeletedMemberIsUnauthorized() throws Exception {
        String token = student("1101");
        members.deleteAll();
        mvc.perform(secured(get("/api/auth/me"), token)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_REQUIRED));
    }
    @Test
    void adminPathsRejectStudents() throws Exception {
        mvc.perform(get("/api/admin/members")).andExpect(status().isUnauthorized());
        mvc.perform(secured(get("/api/admin/members"), student("1101"))).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(SecurityConfig.ADMIN_ONLY));
    }
    @Test
    void imagesNeedTokenButSwaggerIsPublic() throws Exception {
        String missing = "/api/images/00000000-0000-0000-0000-000000000000.jpg";
        mvc.perform(get(missing)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_REQUIRED));
        mvc.perform(secured(get(missing), student("1101"))).andExpect(status().isNotFound());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }
    @Test
    void corsAllowsOnlyConfiguredFrontend() throws Exception {
        mvc.perform(options("/api/items").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        mvc.perform(options("/api/items").header("Origin", "https://unknown.example")
                .header("Access-Control-Request-Method", "POST")).andExpect(status().isForbidden());
    }
    @Test
    void openApiIncludesKoreanOperationAndFieldDescriptions() throws Exception {
        var response = mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        var spec = json.readTree(response);
        assertEquals("찾GO API", spec.at("/info/title").asText());
        assertEquals("물품 등록", spec.at("/paths/~1api~1items/post/summary").asText());
        assertEquals("로그인", spec.at("/paths/~1api~1auth~1login/post/summary").asText());
        assertTrue(spec.at("/paths/~1api~1auth~1signup").isMissingNode());
        assertTrue(spec.at("/paths/~1api~1auth~1csrf").isMissingNode());
        assertTrue(spec.at("/paths/~1api~1auth~1logout").isMissingNode());
        assertFalse(spec.at("/components/schemas/ItemCreateRequest/properties/name/description").asText().isBlank());
        assertEquals("검정 우산", spec.at("/components/schemas/ItemCreateRequest/properties/name/example").asText());
        assertTrue(spec.at("/components/schemas/ItemCreateRequest/required").toString().contains("lostFoundAt"));
        assertTrue(spec.at("/components/schemas/ImageUploadResponse/properties/imageUrl/description").asText().contains("사진"));
    }

}
