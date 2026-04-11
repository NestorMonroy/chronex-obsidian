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

## Descripción

<% tp.file.include('[[common/templateNotes]]') %>

## Detalles

**Prioridad:** {{VALUE:priority}}
**Vence:** {{VALUE:dueDate}}
**Estado:** TODO

## Checklist

- [ ] Subtarea 1
- [ ] Subtarea 2

