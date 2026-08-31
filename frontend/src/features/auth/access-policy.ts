export type AccessRequirement = { anyOf?: string[]; allOf?: string[] };

export const routeAccess: Record<string, AccessRequirement> = {
    "/students": { anyOf: ["students.view", "students.manage"] },
    "/plans": { anyOf: ["plans.view", "plans.manage"] },
    "/finance": { anyOf: ["finance.view", "finance.manage"] },
    "/checkins": { anyOf: ["checkins.view", "checkins.manage"] },
    "/workouts": { anyOf: ["workouts.manage"] },
    "/schedule": { anyOf: ["schedule.view", "schedule.manage"] },
    "/reports": { anyOf: ["reports.view"] },
    "/settings": { anyOf: ["settings.view", "settings.manage", "users.manage"] },
    "/units": { anyOf: ["units.view", "units.manage"] },
    "/automations": { anyOf: ["automations.manage"] },
    "/operations": { anyOf: ["operations.view", "operations.manage"] },
    "/growth": { allOf: ["students.manage", "schedule.manage"] },
    "/relationship": { anyOf: ["students.manage"] },
    "/portal": { anyOf: ["portal.view"] },
    "/documents": { anyOf: ["students.manage"] },
};

export function hasAccess(capabilities: string[], requirement?: AccessRequirement) {
    if (!requirement) return true;
    const requiresStudentPortal = requirement.anyOf?.includes("portal.view") || requirement.allOf?.includes("portal.view");
    if (requiresStudentPortal) return capabilities.includes("portal.view");
    if (capabilities.includes("*")) return true;
    return (!requirement.anyOf?.length || requirement.anyOf.some(item => capabilities.includes(item)))
        && (!requirement.allOf?.length || requirement.allOf.every(item => capabilities.includes(item)));
}

export function hasCapability(capabilities: string[], ...required: string[]) {
    return capabilities.includes("*") || required.some((capability) => capabilities.includes(capability));
}

export function getDashboardDataAccess(capabilities: string[]) {
    return {
        students: hasCapability(capabilities, "students.view", "students.manage"),
        finance: hasCapability(capabilities, "finance.view", "finance.manage"),
        checkins: hasCapability(capabilities, "checkins.view", "checkins.manage"),
    };
}

export function getReportsDataAccess(capabilities: string[]) {
    return {
        finance: hasCapability(capabilities, "finance.view", "finance.manage"),
        students: hasCapability(capabilities, "students.view", "students.manage"),
        checkins: hasCapability(capabilities, "checkins.view", "checkins.manage"),
        retentionManage: hasCapability(capabilities, "students.manage"),
    };
}

export function getStudentDetailsDataAccess(capabilities: string[]) {
    return {
        studentsManage: hasCapability(capabilities, "students.manage"),
        enrollments: hasCapability(capabilities, "enrollments.view", "enrollments.manage"),
        finance: hasCapability(capabilities, "finance.view", "finance.manage"),
        checkins: hasCapability(capabilities, "checkins.view", "checkins.manage"),
        checkinsManage: hasCapability(capabilities, "checkins.manage"),
        workouts: hasCapability(capabilities, "workouts.manage"),
    };
}
