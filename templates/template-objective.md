---
UID: {{VALUE:uniqueId}}
aliases: {{VALUE:alias}}
type: objective
status: ACTIVE
dateCreated: {{VALUE:currentDate}}
tags: [ ]
<% tp.file.include('[[common/templateMetadata]]') %>
---
<%""%>
# 🚀 [[<% tp.file.folder() %>]] {{VALUE:fileName}}

## Acciones Rápidas

[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#2196F3"/></svg> Editar](button://edit?uid={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#1976D2"/></svg> Agregar KR](button://create?type=kr&objective={{VALUE:uniqueId}})
[<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50"/></svg> Completar](button://complete?uid={{VALUE:uniqueId}})

## Descripción

<% tp.file.include('[[common/templateNotes]]') %>

## Key Results

- [ ] KR 1
- [ ] KR 2
- [ ] KR 3

## Acciones

- [ ] Acción 1
- [ ] Acción 2
- [ ] Acción 3

## Progreso

Meta: Definir progreso esperado
Actual: 0%
