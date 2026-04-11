---
UID: {{VALUE:uniqueId}}
aliases: {{VALUE:alias}}
type: task
status: TODO
priority: {{VALUE:priority}}
dueDate: {{VALUE:dueDate}}
dateCreated: {{VALUE:currentDate}}
tags: [ ]
<% tp.file.include('[[common/templateMetadata]]') %>
---
<%""%>
# 📋 [[<% tp.file.folder() %>]] {{VALUE:fileName}}

## Acciones Rápidas

[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#2196F3"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#2196F3"/></svg> Editar](button://edit?uid={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50"/></svg> Completar](button://complete?uid={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#FF9800"/></svg> Prioridad](button://priority?uid={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" fill="#F44336"/></svg> Eliminar](button://delete?uid={{VALUE:uniqueId}})

## Descripción

<% tp.file.include('[[common/templateNotes]]') %>

## Detalles

**Prioridad:** {{VALUE:priority}}
**Vence:** {{VALUE:dueDate}}
**Estado:** TODO

## Checklist

- [ ] Subtarea 1
- [ ] Subtarea 2

