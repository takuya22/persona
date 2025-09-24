import { agent_authors, groups, personas } from "../types/persona.type";

export const getPersonaRoleById = (id: string) => {
  return personas.find((p) => p.id === id)?.role || groups.find((g) => g.id === id)?.role || "All";
}

export const getPersonaNameById = (id: string) => {
  return personas.find((p) => p.id === id)?.name || groups.find((g) => g.id === id)?.name || "全員";
}

export const getPersonaRoleByAuthor = (author: string) => {
  const a = agent_authors.find((a) => author === a.name);
  if (a) {
    return personas.find((p) => p.id === a.roleId)?.name || "AI";
  }
  return "AI";
}