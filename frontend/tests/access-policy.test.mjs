import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardDataAccess, getReportsDataAccess, getStudentDetailsDataAccess, hasAccess, hasCapability, routeAccess } from "../src/features/auth/access-policy.ts";

test("proprietário acessa qualquer rota", () => assert.equal(hasAccess(["*"], routeAccess["/automations"]), true));
test("recepção não acessa automações", () => assert.equal(hasAccess(["students.manage", "checkins.manage", "schedule.manage"], routeAccess["/automations"]), false));
test("recepção acessa alunos e check-ins", () => {
    const capabilities = ["students.manage", "checkins.manage"];
    assert.equal(hasAccess(capabilities, routeAccess["/students"]), true);
    assert.equal(hasAccess(capabilities, routeAccess["/checkins"]), true);
});
test("central operacional exige capacidade operacional", () => {
    assert.equal(hasAccess(["students.manage", "checkins.manage", "units.view"], routeAccess["/operations"]), false);
    assert.equal(hasAccess(["operations.view"], routeAccess["/operations"]), true);
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
test("dashboard do professor não consulta financeiro nem check-ins", () => {
    assert.deepEqual(
        getDashboardDataAccess(["students.view", "workouts.manage", "schedule.manage", "units.view", "operations.view"]),
        { students: true, finance: false, checkins: false },
    );
});
test("dashboard administrativo preserva todas as fontes", () => {
    assert.deepEqual(getDashboardDataAccess(["*"]), { students: true, finance: true, checkins: true });
});

test("matriz das seis funções preserva os limites de navegação", () => {
    const profiles = {
        owner: ["*"],
        admin: ["*"],
        manager: ["students.manage", "finance.view", "reports.view", "settings.view", "units.view"],
        reception: ["students.manage", "checkins.manage", "finance.view", "units.view"],
        trainer: ["students.view", "workouts.manage", "schedule.manage", "units.view"],
        financial: ["students.view", "finance.manage", "reports.view", "units.view"],
    };
    assert.equal(hasAccess(profiles.owner, routeAccess["/settings"]), true);
    assert.equal(hasAccess(profiles.admin, routeAccess["/automations"]), true);
    assert.equal(hasAccess(profiles.manager, routeAccess["/reports"]), true);
    assert.equal(hasAccess(profiles.reception, routeAccess["/workouts"]), false);
    assert.equal(hasAccess(profiles.trainer, routeAccess["/finance"]), false);
    assert.equal(hasAccess(profiles.financial, routeAccess["/finance"]), true);
});

test("relatórios do financeiro não consultam check-ins nem permitem contato", () => {
    assert.deepEqual(
        getReportsDataAccess(["finance.view", "finance.manage", "reports.view", "students.view"]),
        { finance: true, students: true, checkins: false, retentionManage: false },
    );
});

test("ações de escrita não são concedidas por capacidades somente de leitura", () => {
    assert.equal(hasCapability(["finance.view"], "finance.manage"), false);
    assert.equal(hasCapability(["plans.view"], "plans.manage"), false);
    assert.equal(hasCapability(["operations.view"], "operations.manage"), false);
    assert.equal(hasCapability(["units.view"], "units.manage"), false);
    assert.equal(hasCapability(["checkins.view"], "checkins.manage"), false);
});

test("ficha do aluno consulta somente domínios autorizados por perfil", () => {
    assert.deepEqual(
        getStudentDetailsDataAccess(["students.view", "workouts.manage", "schedule.manage"]),
        { studentsManage: false, enrollments: false, finance: false, checkins: false, checkinsManage: false, workouts: true },
    );
    assert.deepEqual(
        getStudentDetailsDataAccess(["students.view", "finance.view", "finance.manage"]),
        { studentsManage: false, enrollments: false, finance: true, checkins: false, checkinsManage: false, workouts: false },
    );
});
