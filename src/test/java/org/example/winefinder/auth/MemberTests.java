package org.example.winefinder.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class MemberTests {
    @Autowired MemberRepository members;
    @Autowired ObjectMapper json;

    @BeforeEach
    void setup() { members.deleteAll(); }

    @Test
    void savesLoginIdRoleAndMustChangePassword() {
        var saved = members.saveAndFlush(new Member("261109", "홍길동", "{noop}hash", Role.STUDENT, true));
        var found = members.findByLoginId("261109").orElseThrow();
        assertEquals(saved.getId(), found.getId());
        assertEquals(Role.STUDENT, found.getRole());
        assertTrue(found.isMustChangePassword());
        assertNull(found.getPhone());
        assertFalse(found.isAdmin());
        assertTrue(members.existsByLoginId("261109"));
        assertFalse(members.existsByLoginId("261110"));
    }

    @Test
    void loginIdMustBeUnique() {
        members.saveAndFlush(new Member("261109", "홍길동", "{noop}hash", Role.STUDENT, true));
        assertThrows(DataIntegrityViolationException.class,
                () -> members.saveAndFlush(new Member("261109", "김철수", "{noop}hash", Role.STUDENT, true)));
    }

    @Test
    void responseHasDesignFieldsWithoutPassword() {
        var admin = members.saveAndFlush(new Member("admin", "관리자", "{noop}hash", Role.ADMIN, false));
        var body = json.readTree(json.writeValueAsString(MemberResponse.from(admin)));
        assertEquals("admin", body.get("loginId").asText());
        assertEquals("ADMIN", body.get("role").asText());
        assertFalse(body.get("mustChangePassword").asBoolean());
        assertTrue(body.has("phone"));
        assertFalse(body.has("passwordHash"));
        assertFalse(body.has("email"));
        assertFalse(body.has("studentId"));
    }
}
