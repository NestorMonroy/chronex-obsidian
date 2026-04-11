---
UID: {{VALUE:uniqueId}}
aliases: {{VALUE:alias}}
type: project
status: ACTIVE
dateCreated: {{VALUE:currentDate}}
tags: [ ]
<% tp.file.include('[[common/templateMetadata]]') %>
---
<%""%>
# 🎯 [[<% tp.file.folder() %>]] {{VALUE:fileName}}

## Acciones Rápidas

[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#1976D2"/></svg> Nueva Tarea](button://create?type=task&project={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#2196F3"/></svg> Editar](button://edit?uid={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v5h7v-5z" fill="#9C27B0"/></svg> Ver Tareas](button://tasks?project={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27z" fill="#9E9E9E"/></svg> Archivar](button://archive?uid={{VALUE:uniqueId}})

## Descripción

<% tp.file.include('[[common/templateNotes]]') %>

## Objetivos

- [ ] Objetivo 1
- [ ] Objetivo 2
- [ ] Objetivo 3

## Tasks

Aquí aparecerán las tareas del proyecto

## Hitos

- [ ] Hito 1
- [ ] Hito 2
