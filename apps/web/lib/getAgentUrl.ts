import "server-only";

export function getAgentUrlByRole(role: string): string {
  switch (role) {
    case "all":
      return process.env.VERTEX_AI_RESOURCE_NAME_ALL!;
    case "pm":
      return process.env.VERTEX_AI_RESOURCE_NAME_PM!;
    case "designer":
      return process.env.VERTEX_AI_RESOURCE_NAME_DESIGNER!;
    case "marketer":
      return process.env.VERTEX_AI_RESOURCE_NAME_MARKETER!;
    case "sales":
      return process.env.VERTEX_AI_RESOURCE_NAME_SALES!;
    case "senior_engineer":
      return process.env.VERTEX_AI_RESOURCE_NAME_SENIOR_ENGINEER!;
    case "hr":
      return process.env.VERTEX_AI_RESOURCE_NAME_HR!;
    case "group1":
      return process.env.VERTEX_AI_RESOURCE_NAME_GROUP1!;
    case "group2":
      return process.env.VERTEX_AI_RESOURCE_NAME_GROUP2!;
    case "group3":
      return process.env.VERTEX_AI_RESOURCE_NAME_GROUP3!;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}