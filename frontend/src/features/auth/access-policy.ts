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
    if (!requirement || capabilities.includes("*")) return true;
    return (!requirement.anyOf?.length || requirement.anyOf.some(item => capabilities.includes(item)))
        && (!requirement.allOf?.length || requirement.allOf.every(item => capabilities.includes(item)));
}
