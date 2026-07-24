-- Execute no SQL Editor do Supabase depois de revisar possíveis duplicidades.
-- Os índices garantem no banco a mesma proteção aplicada pela API.

create unique index if not exists solicitacoes_email_unique
on public.solicitacoes (lower(trim(email)));

create unique index if not exists solicitacoes_whatsapp_unique
on public.solicitacoes ((regexp_replace(whatsapp, '[^0-9]', '', 'g')));

create index if not exists solicitacoes_status_idx
on public.solicitacoes (status);

create index if not exists solicitacoes_mp_preapproval_idx
on public.solicitacoes (mp_preapproval_id);
