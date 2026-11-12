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
    MockMvc mvc;

    @BeforeEach
    void setup() {
        images.deleteAll(); items.deleteAll(); members.deleteAll();
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
    void searchFiltersSortingStatisticsAndRecommendations() throws Exception {
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
        mvc.perform(secured(get("/api/home"), s)).andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.lost").value(1))
                .andExpect(jsonPath("$.found").value(2));
        mvc.perform(secured(get("/api/items").param("size", "101"), s)).andExpect(status().isBadRequest());
        mvc.perform(secured(get("/api/items").param("sort", "invalid"), s)).andExpect(status().isBadRequest());
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
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_JPEG));
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
    @Test
    void phoneIsNormalizedAndNullOrEmptyDeletesIt() throws Exception {
        String token = student("1109");
        mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"01012345678\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.loginId").value("1109"))
                .andExpect(jsonPath("$.phone").value("010-1234-5678"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"123\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("전화번호 형식을 확인해 주세요."));
        assertEquals("010-1234-5678", members.findByLoginId("1109").orElseThrow().getPhone());
        mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.phone").isEmpty());
        mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"010-9876-5432\"}"))
                .andExpect(jsonPath("$.phone").value("010-9876-5432"));
        mvc.perform(secured(patch("/api/auth/me"), token).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":null}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.phone").isEmpty());
        assertNull(members.findByLoginId("1109").orElseThrow().getPhone());
        mvc.perform(patch("/api/auth/me").contentType(MediaType.APPLICATION_JSON).content("{\"phone\":null}"))
                .andExpect(status().isUnauthorized());
    }
    @Test
    void tokenIsRequiredAndExpiredTokenHasOwnMessage() throws Exception {
        mvc.perform(get("/api/items")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityConfig.LOGIN_REQUIRED));
        mvc.perform(get("/api/items/1")).andExpect(status().isUnauthorized());
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
    void imagesAndSwaggerArePublic() throws Exception {
        mvc.perform(get("/api/images/00000000-0000-0000-0000-000000000000.jpg")).andExpect(status().isNotFound());
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
