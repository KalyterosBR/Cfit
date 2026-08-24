import test from "node:test";
import assert from "node:assert/strict";
import { hasAccess, routeAccess } from "../src/features/auth/access-policy.ts";

test("proprietário acessa qualquer rota", () => assert.equal(hasAccess(["*"], routeAccess["/automations"]), true));
test("recepção não acessa automações", () => assert.equal(hasAccess(["students.manage", "checkins.manage", "schedule.manage"], routeAccess["/automations"]), false));
test("recepção acessa alunos e check-ins", () => {
    const capabilities = ["students.manage", "checkins.manage"];
    assert.equal(hasAccess(capabilities, routeAccess["/students"]), true);
    assert.equal(hasAccess(capabilities, routeAccess["/checkins"]), true);
});
test("central operacional exige todas as capacidades", () => {
    assert.equal(hasAccess(["students.manage", "checkins.manage", "units.view"], routeAccess["/operations"]), false);
    assert.equal(hasAccess(["students.manage", "checkins.manage", "workouts.manage", "units.view"], routeAccess["/operations"]), true);
});
test("portal do aluno não concede acesso administrativo", () => {
    const capabilities = ["portal.view"];
    assert.equal(hasAccess(capabilities, routeAccess["/portal"]), true);
    assert.equal(hasAccess(capabilities, routeAccess["/students"]), false);
    assert.equal(hasAccess(capabilities, routeAccess["/finance"]), false);
});
test("documentos e crescimento respeitam capacidades operacionais", () => {
    assert.equal(hasAccess(["students.manage"], routeAccess["/documents"]), true);
    assert.equal(hasAccess(["students.manage"], routeAccess["/growth"]), false);
    assert.equal(hasAccess(["students.manage", "schedule.manage"], routeAccess["/growth"]), true);
});
