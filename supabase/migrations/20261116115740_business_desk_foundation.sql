-- Additive Business Desk. Academy finance and legacy quotations are untouched.
create table private.msbd_roles(user_id uuid primary key references auth.users(id),role text not null check(role in ('admin','sales','finance','management')),changed_at timestamptz not null default now());
create table private.msbd_sequences(kind text not null,year integer not null,next_value bigint not null,primary key(kind,year));
create table private.msbd_audit(id bigint generated always as identity primary key,actor uuid references auth.users(id),action text not null,entity_id uuid,reason text not null default '',before_data jsonb,after_data jsonb,created_at timestamptz not null default now());
alter table private.msbd_roles enable row level security;
alter table private.msbd_sequences enable row level security;
alter table private.msbd_audit enable row level security;
create table public.msbd_settings(id boolean primary key default true check(id),profile jsonb not null,updated_at timestamptz not null default now());
insert into public.msbd_settings(id,profile) values(true,'{"name":"Mega Stride Technologies Limited","trading_name":"Mega Stride","address":"Kubwa, Abuja, Nigeria","phone":"+2347075721887","email":"info@megastride.com.ng","website":"https://www.megastride.com.ng","registration":"9629475","prefix":"MST","sales_discount_bps":0,"tax_bps":0,"tax_label":"Tax not applied","require_owner_approval":true,"notifications_enabled":false,"reminders_enabled":false,"reminder_days":7,"payment_instructions":"Payment instructions must be supplied by authorised company personnel.","signature_note":"Unsigned unless an authorised signature is supplied."}');
create function private.msbd_number(p_kind text) returns text language plpgsql set search_path='' as $$
declare n bigint;y integer:=extract(year from now() at time zone 'Africa/Lagos');prefix text;
begin
 select coalesce(profile->>'prefix','MST') into prefix from public.msbd_settings where id;
 insert into private.msbd_sequences(kind,year,next_value) values(p_kind,y,1) on conflict(kind,year) do update set next_value=private.msbd_sequences.next_value+1 returning next_value into n;
 return prefix||'/'||p_kind||'/'||y::text||'/'||lpad(n::text,greatest(6,length(n::text)),'0');
end $$;
create table public.msbd_clients(id uuid primary key default gen_random_uuid(),number text not null unique default private.msbd_number('CLI'),name text not null check(length(name) between 2 and 180),email text not null check(length(email)<=254 and email=lower(trim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),kind text not null default 'corporate' check(kind in ('individual','corporate')),profile jsonb not null default '{}',assigned_to uuid references auth.users(id),portal_user uuid references auth.users(id),archived boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index msbd_client_email on public.msbd_clients(email);
create index msbd_client_assignment on public.msbd_clients(assigned_to);
create index msbd_client_portal on public.msbd_clients(portal_user);
create table public.msbd_services(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 180),category text not null check(length(category)<=120),description text not null default '' check(length(description)<=5000),unit text not null default 'project' check(length(unit)<=40),price_minor bigint check(price_minor between 0 and 1000000000000),currency text not null default 'NGN' check(currency in ('NGN','USD','GBP','EUR')),pricing text not null default 'custom' check(pricing in ('fixed','hourly','daily','monthly','per_user','per_device','per_project','custom')),active boolean not null default true);
create table public.msbd_documents(id uuid primary key default gen_random_uuid(),number text not null unique,kind text not null check(kind in ('quotation','invoice','receipt','credit_note','statement','order')),client_id uuid not null references public.msbd_clients(id),source_id uuid references public.msbd_documents(id),revision integer not null default 0,token uuid not null default gen_random_uuid() unique,status text not null default 'draft' check(status in ('draft','pending_approval','approved','issued','sent','viewed','accepted','rejected','expired','superseded','converted','cancelled','written_off','partially_refunded')),content jsonb not null,company_snapshot jsonb,client_snapshot jsonb,content_hash text,issued_at timestamptz,due_date date,created_by uuid not null references auth.users(id),approved_by uuid references auth.users(id),approved_at timestamptz,acceptance jsonb,pdf_path text,pdf_sha256 text,created_at timestamptz not null default now());
create index msbd_documents_client on public.msbd_documents(client_id,created_at desc);
create index msbd_documents_status on public.msbd_documents(kind,status,due_date);
create index msbd_documents_source on public.msbd_documents(source_id);
create table public.msbd_payments(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references public.msbd_documents(id),client_id uuid not null references public.msbd_clients(id),reference text not null unique check(length(reference) between 3 and 180),amount_minor bigint not null check(amount_minor between 1 and 1000000000000),refunded_minor bigint not null default 0 check(refunded_minor between 0 and amount_minor),currency text not null check(currency in ('NGN','USD','GBP','EUR')),method text not null check(method in ('bank_transfer','cash','pos','gateway','other')),provider text not null default '' check(length(provider)<=120),payment_date date not null,status text not null default 'pending' check(status in ('pending','confirmed','reversed','rejected')),recorded_by uuid not null references auth.users(id),confirmed_by uuid references auth.users(id),confirmed_at timestamptz,evidence text not null default '' check(length(evidence)<=2000),receipt_id uuid unique references public.msbd_documents(id),created_at timestamptz not null default now());
create index msbd_payment_invoice on public.msbd_payments(invoice_id,status);
create index msbd_payment_client on public.msbd_payments(client_id);
create table public.msbd_reversals(id uuid primary key default gen_random_uuid(),payment_id uuid not null references public.msbd_payments(id),amount_minor bigint not null check(amount_minor>0),reference text not null unique,reason text not null check(length(reason) between 20 and 2000),confirmed_by uuid not null references auth.users(id),confirmed_at timestamptz not null default now());
create table public.msbd_events(id bigint generated always as identity primary key,document_id uuid references public.msbd_documents(id),client_id uuid references public.msbd_clients(id),actor uuid references auth.users(id),action text not null,reason text not null default '',created_at timestamptz not null default now());
create index msbd_events_doc on public.msbd_events(document_id,created_at desc);
create table public.msbd_email_jobs(id uuid primary key default gen_random_uuid(),document_id uuid references public.msbd_documents(id),client_id uuid references public.msbd_clients(id),context jsonb not null default '{}',recipient text not null,event text not null,template jsonb not null,dedupe_key text not null unique,status text not null default 'pending' check(status in ('pending','processing','accepted','failed','suppressed')),attempts integer not null default 0,locked_at timestamptz,first_attempt_at timestamptz,next_attempt_at timestamptz not null default now(),provider_id text unique,provider_status text,provider_event_at timestamptz,last_error text,created_at timestamptz not null default now());
create index msbd_email_queue on public.msbd_email_jobs(status,next_attempt_at);
create table public.msbd_templates(event text primary key,subject text not null check(length(subject) between 2 and 180),body text not null check(length(body) between 2 and 5000),enabled boolean not null default true);
insert into public.msbd_templates(event,subject,body) values('document_issued','Your Mega Stride document is ready','Your document {number} is available in your secure client portal.'),('invoice_reminder','Mega Stride invoice reminder','Please review invoice {number} in your secure client portal. If you have paid, contact our finance team with your payment reference.'),('document_cancelled','Mega Stride document status update','Document {number} has been cancelled. Please review its verification record or contact our team.');
create table public.msbd_attachments(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references public.enquiries(id),object_path text not null unique,name text not null check(length(name)<=180),mime text not null check(mime in ('application/pdf','image/png','image/jpeg')),size_bytes integer not null check(size_bytes between 5 and 2097152),created_at timestamptz not null default now());
create index msbd_attachments_enquiry on public.msbd_attachments(enquiry_id);
-- Authorisation records are server-owned, never based on editable signup metadata.
create function private.msbd_role(p_user uuid) returns text language sql stable security definer set search_path='' as $$
 select case when not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then null when private.academy_super_admin(p_user) then 'super_admin' else (select role from private.msbd_roles where user_id=p_user) end;
$$;
-- Minimal private Auth lookups; commands retain invoker privileges.
create function private.msbd_verified_email(p_user uuid) returns text
language sql stable security definer set search_path='' as $$
 select lower(email) from auth.users where id=p_user and email_confirmed_at is not null
 and not coalesce(is_anonymous,false)
 and (coalesce((select auth.uid())=p_user,false) or current_setting('role',true)='service_role')
$$;
create function private.msbd_user_for_email(p_email text,p_actor uuid) returns uuid
language plpgsql stable security definer set search_path='' as $$begin
 if current_setting('role',true)<>'service_role' or coalesce(private.msbd_role(p_actor),'') not in ('super_admin','admin') then raise exception 'Identity review denied';end if;
 return (select id from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null and not coalesce(is_anonymous,false));
end $$;
revoke all on function private.msbd_verified_email(uuid),private.msbd_user_for_email(text,uuid) from public,anon,authenticated;
grant execute on function private.msbd_verified_email(uuid),private.msbd_user_for_email(text,uuid) to service_role;
create function private.msbd_own_role() returns text language sql stable security definer set search_path='' as $$select private.msbd_role((select auth.uid()));$$;
create function public.my_business_role() returns text language sql stable security invoker set search_path='' as $$select private.msbd_own_role();$$;
create function private.msbd_client_access(target uuid,portal boolean default true) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(select 1 from public.msbd_clients c where c.id=target and (private.msbd_role((select auth.uid())) in ('super_admin','admin','finance','management') or (private.msbd_role((select auth.uid()))='sales' and c.assigned_to=(select auth.uid())) or (portal and c.portal_user=(select auth.uid()) and exists(select 1 from auth.users where id=(select auth.uid()) and email_confirmed_at is not null and lower(email)=c.email))));
$$;
-- Direct mutations are denied. Only validated service commands change business data.
do $$declare t text;begin
 foreach t in array array['msbd_settings','msbd_clients','msbd_services','msbd_documents','msbd_payments','msbd_reversals','msbd_events','msbd_email_jobs','msbd_templates','msbd_attachments'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create policy msbd_settings_read on public.msbd_settings for select to authenticated using((select private.msbd_own_role()) is not null);
create policy msbd_client_read on public.msbd_clients for select to authenticated using(private.msbd_client_access(id));
create policy msbd_service_read on public.msbd_services for select to authenticated using((select private.msbd_own_role()) is not null);
create policy msbd_document_read on public.msbd_documents for select to authenticated using((private.msbd_client_access(client_id,false) and ((select private.msbd_own_role())<>'management' or status not in ('draft','pending_approval'))) or (issued_at is not null and private.msbd_client_access(client_id,true) and not private.msbd_client_access(client_id,false)));
create policy msbd_payment_read on public.msbd_payments for select to authenticated using((select private.msbd_own_role()) in ('super_admin','admin','finance','management') and private.msbd_client_access(client_id,false));
create policy msbd_reversal_read on public.msbd_reversals for select to authenticated using((select private.msbd_own_role()) in ('super_admin','finance','admin','management'));
create policy msbd_event_read on public.msbd_events for select to authenticated using(private.msbd_client_access(client_id,false));
create policy msbd_email_read on public.msbd_email_jobs for select to authenticated using((select private.msbd_own_role()) in ('super_admin','admin','finance'));
create policy msbd_template_read on public.msbd_templates for select to authenticated using((select private.msbd_own_role()) in ('super_admin','admin'));
create policy msbd_attachment_read on public.msbd_attachments for select to authenticated using((select private.msbd_own_role()) in ('super_admin','admin') or exists(select 1 from public.enquiries e where e.id=enquiry_id and e.assigned_to=(select auth.uid()) and (select private.msbd_own_role())='sales'));
create policy msbd_enquiry_read on public.enquiries for select to authenticated using((select private.msbd_own_role()) in ('super_admin','admin') or ((select private.msbd_own_role())='sales' and (assigned_to is null or assigned_to=(select auth.uid()))));
-- Historical issued contents, company/client snapshots and references are immutable.
create function private.msbd_document_guard() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='DELETE' then raise exception 'Business documents cannot be deleted';end if;
 if old.issued_at is not null and (new.content is distinct from old.content or new.company_snapshot is distinct from old.company_snapshot or new.client_snapshot is distinct from old.client_snapshot or new.number<>old.number or new.token<>old.token or new.kind<>old.kind or new.client_id<>old.client_id or new.source_id is distinct from old.source_id or new.content_hash is distinct from old.content_hash or new.issued_at is distinct from old.issued_at or new.due_date is distinct from old.due_date) then raise exception 'Issued document content is immutable';end if;
 if old.pdf_path is not null and (new.pdf_path is distinct from old.pdf_path or new.pdf_sha256 is distinct from old.pdf_sha256) then raise exception 'Issued PDF snapshot cannot be replaced';end if;
 return new;
end $$;
create trigger msbd_document_guard before update or delete on public.msbd_documents for each row execute function private.msbd_document_guard();
create function private.msbd_calculate(p jsonb,p_tax integer) returns jsonb language plpgsql immutable set search_path='' as $$
declare item jsonb;items jsonb:='[]';subtotal bigint:=0;line_discount bigint:=0;discount bigint:=coalesce((p->>'discount_minor')::bigint,0);charges bigint:=coalesce((p->>'charges_minor')::bigint,0);delivery bigint:=coalesce((p->>'delivery_minor')::bigint,0);unit bigint;qty bigint;cut bigint;gross bigint;tax bigint;total bigint;
begin
 if jsonb_typeof(p->'items') is distinct from 'array' or jsonb_array_length(p->'items') not between 1 and 50 or p_tax not between 0 and 10000 or discount<0 or charges<0 or delivery<0 then raise exception 'Invalid pricing';end if;
 for item in select * from jsonb_array_elements(p->'items') loop
 unit:=(item->>'unit_minor')::bigint;qty:=(item->>'quantity_milli')::bigint;cut:=coalesce((item->>'discount_minor')::bigint,0);
 if unit is null or qty is null or unit not between 0 and 1000000000000 or qty not between 1 and 100000000 or length(coalesce(item->>'description','')) not between 2 and 1000 or cut<0 then raise exception 'Invalid line item';end if;
 gross:=round(unit::numeric*qty::numeric/1000)::bigint;
 if cut>gross or gross>1000000000000 then raise exception 'Invalid line discount or amount';end if;
 subtotal:=subtotal+gross;line_discount:=line_discount+cut;
 items:=items||jsonb_build_array(jsonb_build_object('description',item->>'description','unit_minor',unit,'quantity_milli',qty,'discount_minor',cut,'total_minor',gross-cut));
 end loop;
 if discount>subtotal-line_discount then raise exception 'Discount exceeds subtotal';end if;
 tax:=round((subtotal-line_discount-discount)::numeric*p_tax/10000)::bigint;
 total:=subtotal-line_discount-discount+tax+charges+delivery;
 if total not between 0 and 1000000000000 then raise exception 'Total outside supported range';end if;
 return jsonb_build_object('items',items,'subtotal_minor',subtotal,'line_discount_minor',line_discount,'discount_minor',discount,'tax_bps',p_tax,'tax_minor',tax,'charges_minor',charges,'delivery_minor',delivery,'total_minor',total);
end $$;
create function private.msbd_invoice_balance(p_invoice uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('total_minor',(d.content->>'total_minor')::bigint,'paid_minor',coalesce((select sum(p.amount_minor-p.refunded_minor) from public.msbd_payments p where p.invoice_id=d.id and p.status='confirmed'),0),'credit_minor',coalesce((select sum((c.content->>'total_minor')::bigint) from public.msbd_documents c where c.source_id=d.id and c.kind='credit_note' and c.issued_at is not null and c.status<>'cancelled'),0),'outstanding_minor',(d.content->>'total_minor')::bigint-coalesce((select sum(p.amount_minor-p.refunded_minor) from public.msbd_payments p where p.invoice_id=d.id and p.status='confirmed'),0)-coalesce((select sum((c.content->>'total_minor')::bigint) from public.msbd_documents c where c.source_id=d.id and c.kind='credit_note' and c.issued_at is not null and c.status<>'cancelled'),0)) from public.msbd_documents d where d.id=p_invoice and d.kind='invoice';
$$;
create function private.msbd_document_hash(content jsonb,company jsonb,client jsonb) returns text language sql immutable set search_path='' as $$select encode(sha256(convert_to(jsonb_build_object('content',content,'company',company,'client',client)::text,'UTF8')),'hex');$$;
-- Only the trusted server supplies p_actor, after validating its session with Auth.
create function public.msbd_command(p_actor uuid,p_action text,p jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_column
<<command>>
declare r text:=private.msbd_role(p_actor);id uuid:=nullif(p->>'id','')::uuid;c public.msbd_clients;d public.msbd_documents;s public.msbd_settings;pay public.msbd_payments;other public.msbd_documents;result jsonb:='{}';before_data jsonb;v jsonb;kind text;state text;num text;newid uuid;total bigint;milestone jsonb;milestone_total bigint;balance jsonb;request public.enquiries;reason text:=left(coalesce(p->>'reason',''),2000);
begin
 if r is null or p_action is null or pg_column_size(p)>150000 then raise exception 'Business Desk access denied';end if;
 select * into strict s from public.msbd_settings where id=true;
 if p_action='settings' then
  if r<>'super_admin' then raise exception 'Owner only';end if;
  v:=p->'profile';if jsonb_typeof(v)<>'object' or length(coalesce(v->>'name','')) not between 2 and 180 or length(coalesce(v->>'prefix','')) not between 2 and 10 or (v->>'prefix') !~ '^[A-Z0-9]+$' or coalesce((v->>'tax_bps')::integer,-1) not between 0 and 10000 or coalesce((v->>'reminder_days')::integer,0) not between 1 and 90 then raise exception 'Invalid company settings';end if;
  if coalesce((v->>'sales_discount_bps')::integer,0) not between 0 and 10000 then raise exception 'Invalid discount permission';end if;
  before_data:=s.profile;update public.msbd_settings set profile=v,updated_at=now() where id;result:=v;
 elsif p_action='role' then
  if r<>'super_admin' or length(reason)<20 or private.academy_super_admin(id) then raise exception 'Owner role management required';end if;
  kind:=p->>'role';if kind not in ('admin','sales','finance','management','none') or not private.account_is_verified(command.id) then raise exception 'Verified staff identity required';end if;
  select to_jsonb(x) into before_data from private.msbd_roles x where user_id=id;
  if kind='none' then delete from private.msbd_roles where user_id=id;else insert into private.msbd_roles(user_id,role) values(id,kind) on conflict(user_id) do update set role=excluded.role,changed_at=now();end if;result:=jsonb_build_object('role',kind);
 elsif p_action in ('client_save','client_archive','client_portal') then
  if r not in ('super_admin','admin','sales') then raise exception 'Client management denied';end if;
  if id is not null then select * into strict c from public.msbd_clients where msbd_clients.id=command.id for update;if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;before_data:=to_jsonb(c);end if;
  if p_action='client_save' then
   if nullif(p->>'assigned_to','') is not null and coalesce(private.msbd_role((p->>'assigned_to')::uuid),'') not in ('super_admin','admin','sales') then raise exception 'Choose an authorised sales or administrative assignee';end if;
   if id is null then insert into public.msbd_clients(name,email,kind,profile,assigned_to) values(trim(p->>'name'),lower(trim(p->>'email')),p->>'kind',coalesce(p->'profile','{}'),case when r='sales' then p_actor else coalesce(nullif(p->>'assigned_to','')::uuid,p_actor) end) returning * into c;
   else update public.msbd_clients set name=trim(p->>'name'),email=lower(trim(p->>'email')),kind=p->>'kind',profile=coalesce(p->'profile','{}'),portal_user=case when email<>lower(trim(p->>'email')) then null else portal_user end,assigned_to=case when r='sales' then assigned_to else coalesce(nullif(p->>'assigned_to','')::uuid,assigned_to) end,updated_at=now() where msbd_clients.id=command.id returning * into c;end if;
  elsif p_action='client_archive' then update public.msbd_clients set archived=not archived,updated_at=now() where msbd_clients.id=command.id returning * into c;
  else
   if r not in ('super_admin','admin') or length(reason)<20 then raise exception 'Portal linking requires identity review';end if;
   newid:=nullif(p->>'portal_user','')::uuid;
   if coalesce((p->>'link_matching_email')::boolean,false) then
    newid:=private.msbd_user_for_email(c.email,p_actor);
    if newid is null then raise exception 'Client must create and verify an account with the matching email first';end if;
   end if;
   if newid is not null and private.msbd_verified_email(newid) is distinct from c.email then raise exception 'Verified account must match client email';end if;
   update public.msbd_clients set portal_user=newid where msbd_clients.id=command.id returning * into c;
  end if;id:=c.id;result:=jsonb_build_object('id',id,'number',c.number);
 elsif p_action='service_save' then
  if r not in ('super_admin','admin') then raise exception 'Service management denied';end if;
  if id is null then insert into public.msbd_services(name,category,description,unit,price_minor,currency,pricing,active) values(p->>'name',p->>'category',coalesce(p->>'description',''),coalesce(p->>'unit','project'),nullif(p->>'price_minor','')::bigint,p->>'currency',p->>'pricing',coalesce((p->>'active')::boolean,true)) returning msbd_services.id into id;
  else update public.msbd_services set name=p->>'name',category=p->>'category',description=coalesce(p->>'description',''),unit=p->>'unit',price_minor=nullif(p->>'price_minor','')::bigint,currency=p->>'currency',pricing=p->>'pricing',active=(p->>'active')::boolean where msbd_services.id=command.id;end if;result:=jsonb_build_object('id',id);
 elsif p_action in ('document_save','quotation_convert','document_revise') then
  if r not in ('super_admin','admin','sales') then raise exception 'Document preparation denied';end if;
  if p_action='quotation_convert' then
   select * into strict d from public.msbd_documents where msbd_documents.id=command.id for update;
   if d.kind<>'quotation' or d.status not in ('accepted','issued','sent','viewed') or d.issued_at is null or d.due_date<current_date then raise exception 'Quotation must be issued, current and accepted or explicitly approved for conversion';end if;
   if exists(select 1 from public.msbd_documents where source_id=d.id and kind='invoice') then raise exception 'Quotation already invoiced';end if;
   select * into strict c from public.msbd_clients where msbd_clients.id=d.client_id;
   if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;
   insert into public.msbd_documents(number,kind,client_id,source_id,content,due_date,created_by) values(private.msbd_number('INV'),'invoice',d.client_id,d.id,d.content,nullif(p->>'due_date','')::date,p_actor) returning msbd_documents.id into newid;
   before_data:=to_jsonb(d);update public.msbd_documents set status='converted' where msbd_documents.id=d.id;id:=newid;
  elsif p_action='document_revise' then
   select * into strict d from public.msbd_documents where msbd_documents.id=command.id for update;
   if d.kind<>'quotation' or d.issued_at is null or d.status in ('converted','cancelled','superseded') or length(reason)<20 then raise exception 'A controlled quotation revision is required';end if;
   select * into strict c from public.msbd_clients where msbd_clients.id=d.client_id;
   if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;
   before_data:=to_jsonb(d);
   insert into public.msbd_documents(number,kind,client_id,source_id,revision,content,due_date,created_by) values(regexp_replace(d.number,'-R[0-9]+$','')||'-R'||(d.revision+1)::text,'quotation',d.client_id,d.id,d.revision+1,d.content,nullif(p->>'due_date','')::date,p_actor) returning msbd_documents.id into newid;
   update public.msbd_documents set status='superseded' where msbd_documents.id=d.id;id:=newid;
  else
   kind:=p->>'kind';if kind not in ('quotation','invoice','order') or (r='sales' and kind<>'quotation') then raise exception 'Document type denied';end if;
   select * into strict c from public.msbd_clients where msbd_clients.id=(p->>'client_id')::uuid and not archived;
   if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;
   if length(coalesce(p->'content'->>'title','')) not between 2 and 180 or coalesce(p->'content'->>'currency','') not in ('NGN','USD','GBP','EUR') then raise exception 'Document details required';end if;
   total:=coalesce((p->'content'->>'tax_bps')::integer,0);if total<>0 and total<>coalesce((s.profile->>'tax_bps')::integer,0) then raise exception 'Tax must match authorised configuration';end if;
   v:=private.msbd_calculate(p->'content',total::integer)||jsonb_build_object('title',p->'content'->>'title','currency',p->'content'->>'currency','terms',left(coalesce(p->'content'->>'terms',''),20000),'category',left(coalesce(p->'content'->>'category',''),120),'schedule',coalesce(p->'content'->'schedule','[]'));
   if r='sales' and ((v->>'line_discount_minor')::bigint+(v->>'discount_minor')::bigint)::numeric>(v->>'subtotal_minor')::numeric*coalesce((s.profile->>'sales_discount_bps')::integer,0)/10000 then raise exception 'Discount exceeds authorised sales permission';end if;
   if jsonb_typeof(v->'schedule') is distinct from 'array' or jsonb_array_length(v->'schedule')>24 then raise exception 'Invalid payment schedule';end if;
   milestone_total:=0;for milestone in select * from jsonb_array_elements(v->'schedule') loop
    if length(coalesce(milestone->>'label','')) not between 2 and 180 or coalesce((milestone->>'amount_minor')::bigint,0)<1 or coalesce(milestone->>'due_date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid payment milestone';end if;
    perform (milestone->>'due_date')::date;milestone_total:=milestone_total+(milestone->>'amount_minor')::bigint;
   end loop;
   if jsonb_array_length(v->'schedule')>0 and milestone_total<>(v->>'total_minor')::bigint then raise exception 'Payment schedule must equal document total';end if;
   if id is null then insert into public.msbd_documents(number,kind,client_id,content,due_date,created_by) values(private.msbd_number(case kind when 'quotation' then 'QTN' when 'invoice' then 'INV' else 'ORD' end),kind,c.id,v,nullif(p->>'due_date','')::date,p_actor) returning msbd_documents.id into id;
   else select * into strict d from public.msbd_documents where msbd_documents.id=command.id for update;if d.status<>'draft' or d.kind<>kind or d.client_id<>c.id then raise exception 'Only the original draft can be edited';end if;before_data:=to_jsonb(d);update public.msbd_documents set content=v,due_date=nullif(p->>'due_date','')::date where msbd_documents.id=command.id;end if;
  end if;result:=jsonb_build_object('id',id);
 elsif p_action in ('submit','approve','return_draft','issue','cancel','write_off','document_email') then
  select * into strict d from public.msbd_documents where msbd_documents.id=command.id for update;before_data:=to_jsonb(d);
  select * into strict c from public.msbd_clients where msbd_clients.id=d.client_id;
  if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;
  if p_action='submit' then
   if r not in ('super_admin','admin','sales') or d.status<>'draft' then raise exception 'Submission denied';end if;state:='pending_approval';
  elsif p_action='approve' then
   if r not in ('super_admin','admin') or (coalesce((s.profile->>'require_owner_approval')::boolean,true) and r<>'super_admin') or d.status<>'pending_approval' then raise exception 'Approval denied';end if;
   update public.msbd_documents set approved_by=p_actor,approved_at=now() where msbd_documents.id=d.id;state:='approved';
  elsif p_action='return_draft' then
   if r not in ('super_admin','admin') or d.status not in ('pending_approval','approved') or d.issued_at is not null or length(reason)<20 then raise exception 'Return to draft denied';end if;state:='draft';update public.msbd_documents set approved_by=null,approved_at=null where msbd_documents.id=d.id;
  elsif p_action='issue' then
   if r not in ('super_admin','admin') or d.status<>'approved' or d.approved_by is null or d.kind='receipt' then raise exception 'Issue denied';end if;
   if d.kind='quotation' and (d.due_date is null or d.due_date<current_date) then raise exception 'A current quotation expiry is required';end if;
   update public.msbd_documents set company_snapshot=s.profile,client_snapshot=jsonb_build_object('number',c.number,'name',c.name,'email',c.email,'kind',c.kind,'profile',c.profile),issued_at=now(),content_hash=private.msbd_document_hash(d.content,s.profile,jsonb_build_object('number',c.number,'name',c.name,'email',c.email,'kind',c.kind,'profile',c.profile)) where msbd_documents.id=d.id;state:='issued';
  elsif p_action in ('cancel','write_off') then
   if r<>'super_admin' or length(reason)<20 or d.kind='receipt' or d.status in ('cancelled','superseded') then raise exception 'Cancellation requires owner review; receipts require payment reversal';end if;
   if d.kind='invoice' and exists(select 1 from public.msbd_payments where invoice_id=d.id and status='confirmed') then raise exception 'Reverse confirmed payments before cancellation';end if;
   state:=case when p_action='cancel' then 'cancelled' else 'written_off' end;
  else
   if r not in ('super_admin','admin','finance','sales') or d.issued_at is null or d.status in ('cancelled','superseded') then raise exception 'Document delivery denied';end if;
   if not exists(select 1 from public.msbd_templates where event='document_issued' and enabled) then raise exception 'Email template disabled';end if;
   insert into public.msbd_email_jobs(document_id,recipient,event,template,dedupe_key) select d.id,c.email,'document_issued',jsonb_build_object('subject',subject,'body',body),d.id::text||'/issue/'||md5(c.email) from public.msbd_templates where event='document_issued' on conflict(dedupe_key) do nothing;
   state:=d.status;
  end if;
  update public.msbd_documents set status=state where msbd_documents.id=d.id;result:=jsonb_build_object('id',d.id,'status',state);
 elsif p_action in ('payment_record','payment_confirm','payment_reject','payment_reverse') then
  if r not in ('super_admin','finance') then raise exception 'Finance permission required';end if;
  if p_action='payment_record' then
   select * into strict d from public.msbd_documents where msbd_documents.id=(p->>'invoice_id')::uuid and kind='invoice' and issued_at is not null and status not in ('cancelled','written_off') for update;
   total:=(p->>'amount_minor')::bigint;balance:=private.msbd_invoice_balance(d.id);
   if total>(balance->>'outstanding_minor')::bigint then raise exception 'Overpayment requires separate review';end if;
   insert into public.msbd_payments(invoice_id,client_id,reference,amount_minor,currency,method,provider,payment_date,recorded_by,evidence) values(d.id,d.client_id,trim(p->>'reference'),total,d.content->>'currency',p->>'method',coalesce(p->>'provider',''),(p->>'payment_date')::date,p_actor,left(coalesce(p->>'evidence',''),2000)) returning msbd_payments.id into id;
  else
   -- Invoice row is the common lock for all allocation/confirmation operations.
   select * into strict pay from public.msbd_payments where msbd_payments.id=command.id;
   select * into strict d from public.msbd_documents where msbd_documents.id=pay.invoice_id for update;
   select * into strict pay from public.msbd_payments where msbd_payments.id=command.id for update;before_data:=to_jsonb(pay);
   if length(reason)<20 then raise exception 'A reconciliation reason is required';end if;
   if p_action='payment_confirm' then
    if pay.status='confirmed' then return jsonb_build_object('id',pay.id,'receipt_id',pay.receipt_id);end if;
    if pay.status<>'pending' or coalesce((p->>'confirmed_received')::boolean,false)<>true or length(pay.evidence)<5 or d.status in ('cancelled','written_off') then raise exception 'Actual received funds and supporting evidence must be confirmed';end if;
    balance:=private.msbd_invoice_balance(d.id);if pay.amount_minor>(balance->>'outstanding_minor')::bigint then raise exception 'Confirmed allocations would overpay invoice';end if;
    select * into strict c from public.msbd_clients where msbd_clients.id=pay.client_id;
    v:=jsonb_build_object('title','Payment received for '||d.number,'currency',pay.currency,'items',jsonb_build_array(jsonb_build_object('description','Payment against invoice '||d.number,'quantity_milli',1000,'unit_minor',pay.amount_minor,'discount_minor',0,'total_minor',pay.amount_minor)),'subtotal_minor',pay.amount_minor,'line_discount_minor',0,'discount_minor',0,'tax_bps',0,'tax_minor',0,'charges_minor',0,'delivery_minor',0,'total_minor',pay.amount_minor,'payment_reference',pay.reference,'payment_method',pay.method,'payment_date',pay.payment_date,'invoice_number',d.number,'outstanding_minor',(balance->>'outstanding_minor')::bigint-pay.amount_minor,'terms','Receipt confirms only the recorded payment against this invoice.');
    insert into public.msbd_documents(number,kind,client_id,source_id,status,content,company_snapshot,client_snapshot,content_hash,issued_at,created_by,approved_by,approved_at) values(private.msbd_number('RCT'),'receipt',pay.client_id,d.id,'issued',v,s.profile,d.client_snapshot,private.msbd_document_hash(v,s.profile,d.client_snapshot),now(),p_actor,p_actor,now()) returning msbd_documents.id into newid;
    update public.msbd_payments set status='confirmed',confirmed_by=p_actor,confirmed_at=now(),receipt_id=newid where msbd_payments.id=pay.id;result:=jsonb_build_object('id',pay.id,'receipt_id',newid);
   elsif p_action='payment_reject' then
    if pay.status<>'pending' then raise exception 'Only pending payment can be rejected';end if;update public.msbd_payments set status='rejected' where msbd_payments.id=pay.id;
   else
    if r<>'super_admin' or pay.status<>'confirmed' or length(coalesce(p->>'reversal_reference',''))<3 or coalesce((p->>'refund_completed')::boolean,false)<>true then raise exception 'Owner confirmation of an actual reversal is required';end if;
    total:=coalesce((p->>'amount_minor')::bigint,pay.amount_minor-pay.refunded_minor);
    if total<1 or total>pay.amount_minor-pay.refunded_minor then raise exception 'Refund exceeds confirmed unrefunded payment';end if;
    insert into public.msbd_reversals(payment_id,amount_minor,reference,reason,confirmed_by) values(pay.id,total,p->>'reversal_reference',reason,p_actor);
    update public.msbd_payments set refunded_minor=pay.refunded_minor+total,status=case when pay.refunded_minor+total=pay.amount_minor then 'reversed' else status end where msbd_payments.id=pay.id;
    update public.msbd_documents set status=case when pay.refunded_minor+total=pay.amount_minor then 'cancelled' else 'partially_refunded' end where msbd_documents.id=pay.receipt_id;
   end if;
  end if;result:=result||jsonb_build_object('id',id);
 elsif p_action='credit_note' then
  if r<>'super_admin' or length(reason)<20 then raise exception 'Owner approval required';end if;
  select * into strict d from public.msbd_documents where msbd_documents.id=(p->>'invoice_id')::uuid and kind='invoice' and issued_at is not null and status not in ('cancelled','written_off') for update;
  total:=(p->>'amount_minor')::bigint;balance:=private.msbd_invoice_balance(d.id);if total<1 or total>(balance->>'outstanding_minor')::bigint then raise exception 'Credit cannot exceed unpaid balance; reverse actual refunds first';end if;
  v:=jsonb_build_object('title','Credit against '||d.number,'currency',d.content->>'currency','items',jsonb_build_array(jsonb_build_object('description',reason,'quantity_milli',1000,'unit_minor',total,'discount_minor',0,'total_minor',total)),'subtotal_minor',total,'total_minor',total,'terms',reason);
  insert into public.msbd_documents(number,kind,client_id,source_id,status,content,company_snapshot,client_snapshot,content_hash,issued_at,created_by,approved_by,approved_at) values(private.msbd_number('CRN'),'credit_note',d.client_id,d.id,'issued',v,s.profile,d.client_snapshot,private.msbd_document_hash(v,s.profile,d.client_snapshot),now(),p_actor,p_actor,now()) returning msbd_documents.id into id;result:=jsonb_build_object('id',id);
 elsif p_action='template_save' then
  if r<>'super_admin' then raise exception 'Owner only';end if;
  if not exists(select 1 from public.msbd_templates where event=p->>'event') then raise exception 'Unsupported template';end if;
  update public.msbd_templates set subject=p->>'subject',body=p->>'body',enabled=(p->>'enabled')::boolean where event=p->>'event';
 elsif p_action='statement' then
  if r not in ('super_admin','finance') then raise exception 'Finance permission required';end if;
  select * into strict c from public.msbd_clients where msbd_clients.id=(p->>'client_id')::uuid;
  if p->>'currency' not in ('NGN','USD','GBP','EUR') then raise exception 'Invalid currency';end if;
  select jsonb_build_object('title','Account statement for '||c.name,'currency',p->>'currency','items',coalesce(jsonb_agg(jsonb_build_object('description',x.number||' · outstanding balance','quantity_milli',1000,'unit_minor',x.balance,'discount_minor',0,'total_minor',x.balance)),'[]'),'subtotal_minor',coalesce(sum(x.balance),0),'total_minor',coalesce(sum(x.balance),0),'terms','Statement of outstanding issued invoices at '||now()::text||'. Confirmed payments and credit notes are reflected; this is not a payment receipt.') into v from (select q.number,(private.msbd_invoice_balance(q.id)->>'outstanding_minor')::bigint balance from public.msbd_documents q where q.client_id=c.id and q.kind='invoice' and q.issued_at is not null and q.status not in ('cancelled','written_off') and q.content->>'currency'=p->>'currency') x;
  insert into public.msbd_documents(number,kind,client_id,status,content,company_snapshot,client_snapshot,content_hash,issued_at,created_by,approved_by,approved_at) values(private.msbd_number('STM'),'statement',c.id,'issued',v,s.profile,jsonb_build_object('number',c.number,'name',c.name,'email',c.email,'profile',c.profile),private.msbd_document_hash(v,s.profile,jsonb_build_object('number',c.number,'name',c.name,'email',c.email,'profile',c.profile)),now(),p_actor,p_actor,now()) returning msbd_documents.id into id;result:=jsonb_build_object('id',id);
 elsif p_action='client_note' then
  if r not in ('super_admin','admin','sales','finance') then raise exception 'Note permission denied';end if;
  select * into strict c from public.msbd_clients where msbd_clients.id=(p->>'client_id')::uuid;
  if r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Client assignment denied';end if;
  insert into public.msbd_client_notes(client_id,body,actor) values(c.id,p->>'body',p_actor) returning msbd_client_notes.id into id;result:=jsonb_build_object('id',id);
 elsif p_action='request_convert' then
  if r not in ('super_admin','admin','sales') then raise exception 'Request conversion denied';end if;
  select * into strict request from public.enquiries where enquiries.id=command.id and kind='quotation' for update;
  if r='sales' and request.assigned_to is not null and request.assigned_to<>p_actor then raise exception 'Request assignment denied';end if;
  select * into c from public.msbd_clients where email=lower(request.email);
  if not found then insert into public.msbd_clients(name,email,kind,profile,assigned_to) values(coalesce(nullif(request.company,''),request.name),lower(request.email),case when request.company='' then 'individual' else 'corporate' end,jsonb_build_object('contact',request.name,'phone',request.phone,'country',request.country,'state',request.details->>'state'),p_actor) returning * into c;
  elsif r='sales' and c.assigned_to is distinct from p_actor then raise exception 'Existing client belongs to another account';end if;
  update public.enquiries set assigned_to=p_actor,status='under_review' where enquiries.id=request.id;
  result:=jsonb_build_object('id',c.id,'client_id',c.id,'request_id',request.id);
 elsif p_action='enquiry_claim' then
  if r not in ('super_admin','admin','sales') then raise exception 'Request access denied';end if;
  update public.enquiries set assigned_to=p_actor,status='under_review' where enquiries.id=command.id and kind='quotation' and (assigned_to is null or assigned_to=p_actor or r in ('super_admin','admin'));if not found then raise exception 'Request already assigned';end if;result:=jsonb_build_object('id',id);
 else raise exception 'Unsupported Business Desk command';
 end if;
 if coalesce((s.profile->>'notifications_enabled')::boolean,false) then
  kind:=null;newid:=null;
  if p_action='client_save' and before_data is null then
   insert into public.msbd_email_jobs(client_id,context,recipient,event,template,dedupe_key) select c.id,jsonb_build_object('number',c.number,'company',s.profile->>'name','internal',true),s.profile->>'email','client_registered',jsonb_build_object('subject',subject,'body',body),c.id::text||'/registered' from public.msbd_templates where event='client_registered' and enabled on conflict(dedupe_key) do nothing;
  elsif p_action in ('submit','approve','issue','cancel','write_off') then
   newid:=id;kind:=case p_action when 'submit' then 'approval_required' when 'approve' then 'document_approved' when 'issue' then 'document_issued' else 'document_cancelled' end;
  elsif p_action='payment_confirm' and result?'receipt_id' then newid:=(result->>'receipt_id')::uuid;kind:='document_issued';
  elsif p_action='payment_reverse' then newid:=pay.receipt_id;kind:='document_status_changed';
  end if;
  if newid is not null and kind is not null then
   insert into public.msbd_email_jobs(document_id,client_id,context,recipient,event,template,dedupe_key)
   select q.id,q.client_id,jsonb_build_object('number',q.number,'company',q.company_snapshot->>'name','internal',command.kind in ('approval_required','document_approved')),case when command.kind in ('approval_required','document_approved') then s.profile->>'email' else q.client_snapshot->>'email' end,command.kind,jsonb_build_object('subject',t.subject,'body',t.body),q.id::text||case when command.kind='document_issued' then '/issue/'||md5(q.client_snapshot->>'email') else '/'||command.kind||'/'||coalesce(q.content_hash,md5(q.content::text)) end from public.msbd_documents q cross join public.msbd_templates t where q.id=newid and t.event=command.kind and t.enabled on conflict(dedupe_key) do nothing;
  end if;
 end if;
 insert into private.msbd_audit(actor,action,entity_id,reason,before_data,after_data) values(p_actor,p_action,id,reason,before_data,result);
 if p_action in ('client_save','client_archive','client_portal') then insert into public.msbd_events(client_id,actor,action,reason) values(id,p_actor,p_action,reason);end if;
 if id is not null and exists(select 1 from public.msbd_documents where msbd_documents.id=command.id) then insert into public.msbd_events(document_id,client_id,actor,action,reason) select id,client_id,p_actor,p_action,reason from public.msbd_documents where msbd_documents.id=command.id;end if;
 return result;
end $$;
create function public.msbd_client_response(p_actor uuid,p_document uuid,p_action text,p_terms boolean,p_reason text) returns void language plpgsql security invoker set search_path='' as $$
declare d public.msbd_documents;c public.msbd_clients;
begin
 if not private.account_is_verified(p_actor) then raise exception 'Verified client account required';end if;
 select * into strict d from public.msbd_documents where id=p_document for update;
 select * into strict c from public.msbd_clients where id=d.client_id and portal_user=p_actor and private.msbd_verified_email(p_actor)=msbd_clients.email;
 if d.issued_at is null or d.kind<>'quotation' or d.status not in ('issued','sent','viewed') or d.due_date<current_date then raise exception 'Quotation is not open for a response';end if;
 if p_action not in ('accepted','rejected','revision_requested') or (p_action='accepted' and p_terms is distinct from true) or length(coalesce(p_reason,''))>2000 then raise exception 'Explicit response and terms are required';end if;
 update public.msbd_documents set status=case when p_action='revision_requested' then status else p_action end,acceptance=jsonb_build_object('action',p_action,'actor',p_actor,'recorded_at',now(),'terms_accepted',p_terms,'document_hash',d.content_hash,'reason',p_reason) where id=d.id;
 insert into public.msbd_events(document_id,client_id,actor,action,reason) values(d.id,d.client_id,p_actor,p_action,coalesce(p_reason,''));
 insert into private.msbd_audit(actor,action,entity_id,reason,after_data) values(p_actor,p_action,d.id,coalesce(p_reason,''),jsonb_build_object('document_hash',d.content_hash,'terms',p_terms));
 if coalesce((select (profile->>'notifications_enabled')::boolean from public.msbd_settings where id),false) then
  insert into public.msbd_email_jobs(document_id,client_id,context,recipient,event,template,dedupe_key) select d.id,d.client_id,jsonb_build_object('number',d.number,'internal',true),s.profile->>'email','quotation_'||p_action,jsonb_build_object('subject',t.subject,'body',t.body),d.id::text||'/client/'||p_action from public.msbd_templates t cross join public.msbd_settings s where s.id and t.event='quotation_'||p_action and t.enabled on conflict(dedupe_key) do nothing;
 end if;
end $$;
create function public.msbd_invoice_balance(p_actor uuid,p_invoice uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.msbd_documents;r text:=private.msbd_role(p_actor);
begin
 select * into strict d from public.msbd_documents where id=p_invoice and kind='invoice';
 if coalesce(r,'') not in ('super_admin','admin','finance','management') and not exists(select 1 from public.msbd_clients c where c.id=d.client_id and c.portal_user=p_actor and private.msbd_verified_email(p_actor)=c.email and d.issued_at is not null) then raise exception 'Finance access denied';end if;
 return private.msbd_invoice_balance(d.id);
end $$;
create function public.msbd_verification(p_token uuid,p_rate text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.msbd_documents;hits integer;state text;balance jsonb;
begin
 if length(p_rate)<>64 then raise exception 'Invalid request';end if;
 insert into private.rate_limits(key,window_start,hits) values('msbd-verify/'||p_rate,now(),1) on conflict(key) do update set hits=case when private.rate_limits.window_start<now()-interval '1 minute' then 1 else private.rate_limits.hits+1 end,window_start=case when private.rate_limits.window_start<now()-interval '1 minute' then now() else private.rate_limits.window_start end returning private.rate_limits.hits into hits;
 if hits>30 then return jsonb_build_object('limited',true);end if;
 select * into d from public.msbd_documents where token=p_token and issued_at is not null;
 if not found then return null;end if;
 state:=d.status;
 if d.kind='quotation' and state in ('issued','sent','viewed') and d.due_date<current_date then state:='expired';end if;
 if d.kind='invoice' and state not in ('cancelled','written_off') then balance:=private.msbd_invoice_balance(d.id);state:=case when (balance->>'outstanding_minor')::bigint=0 then 'paid' when (balance->>'paid_minor')::bigint>0 then 'partially_paid' when d.due_date<current_date then 'overdue' else 'unpaid' end;end if;
 return jsonb_build_object('company',d.company_snapshot->>'name','kind',d.kind,'number',d.number,'issued_at',d.issued_at,'status',state,'client','Client details protected','valid',state not in ('cancelled','superseded','expired','written_off'));
end $$;
create function public.msbd_record_pdf(p_id uuid,p_hash text,p_path text,p_sha text) returns text language plpgsql security invoker set search_path='' as $$
declare d public.msbd_documents;
begin
 select * into strict d from public.msbd_documents where id=p_id and issued_at is not null for update;
 if d.content_hash<>p_hash or p_path<>p_id::text||'/'||p_hash||'.pdf' or p_sha !~ '^[a-f0-9]{64}$' then raise exception 'Invalid document snapshot';end if;
 if d.pdf_path is null then update public.msbd_documents set pdf_path=p_path,pdf_sha256=p_sha where id=d.id;end if;
 return coalesce(d.pdf_path,p_path);
end $$;
create function public.msbd_claim_email_jobs() returns setof public.msbd_email_jobs language sql security invoker set search_path='' as $$
 update public.msbd_email_jobs j set status='processing',attempts=j.attempts+1,locked_at=now(),first_attempt_at=coalesce(j.first_attempt_at,now()) where j.id in (select id from public.msbd_email_jobs where ((status in ('pending','failed') and next_attempt_at<=now()) or (status='processing' and locked_at<now()-interval '10 minutes')) and attempts<6 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at for update skip locked limit 5) returning j.*;
$$;
create function public.msbd_queue_reminders() returns integer language plpgsql security invoker set search_path='' as $$
declare settings jsonb;n integer;days integer;
begin
 select profile into settings from public.msbd_settings where id;
 if coalesce((settings->>'reminders_enabled')::boolean,false)<>true then return 0;end if;days:=greatest(1,least(90,(settings->>'reminder_days')::integer));
 insert into public.msbd_email_jobs(document_id,recipient,event,template,dedupe_key)
 select d.id,c.email,'invoice_reminder',jsonb_build_object('subject',t.subject,'body',t.body),d.id::text||'/reminder/'||floor((current_date-date '2000-01-01')::numeric/days)::text from public.msbd_documents d join public.msbd_clients c on c.id=d.client_id cross join public.msbd_templates t where t.event='invoice_reminder' and t.enabled and d.kind='invoice' and d.issued_at is not null and d.status not in ('cancelled','written_off') and d.due_date<=current_date+3 and (private.msbd_invoice_balance(d.id)->>'outstanding_minor')::bigint>0 on conflict(dedupe_key) do nothing;
 get diagnostics n=row_count;
 insert into public.msbd_email_jobs(document_id,client_id,context,recipient,event,template,dedupe_key)
 select d.id,d.client_id,jsonb_build_object('number',d.number,'internal',true),settings->>'email','quotation_expiring',jsonb_build_object('subject',t.subject,'body',t.body),d.id::text||'/expiry/'||floor((current_date-date '2000-01-01')::numeric/days)::text from public.msbd_documents d cross join public.msbd_templates t where t.event='quotation_expiring' and t.enabled and d.kind='quotation' and d.status in ('issued','sent','viewed') and d.due_date<=current_date+3 on conflict(dedupe_key) do nothing;
 insert into public.msbd_email_jobs(context,recipient,event,template,dedupe_key)
 select jsonb_build_object('number',e.reference,'internal',true),settings->>'email','unanswered_request',jsonb_build_object('subject',t.subject,'body',t.body),e.id::text||'/follow-up/'||floor((current_date-date '2000-01-01')::numeric/days)::text from public.enquiries e cross join public.msbd_templates t where t.event='unanswered_request' and t.enabled and e.kind='quotation' and e.status in ('new','under_review') and e.created_at<now()-interval '2 days' on conflict(dedupe_key) do nothing;
 return n;
end $$;
create function private.msbd_roles_list_identities(p_actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if current_setting('role',true)<>'service_role' or coalesce(private.msbd_role(p_actor),'')<>'super_admin' then raise exception 'Owner only';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'role',case when private.academy_super_admin(u.id) then 'super_admin' else coalesce(r.role,'none') end)) from auth.users u left join private.msbd_roles r on r.user_id=u.id where u.email_confirmed_at is not null),'[]');
end $$;
revoke all on function private.msbd_roles_list_identities(uuid) from public,anon,authenticated;
grant execute on function private.msbd_roles_list_identities(uuid) to service_role;
create function public.msbd_roles_list(p_actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.msbd_roles_list_identities(p_actor);$$;
create function public.msbd_attachment_reserve(p_enquiry uuid,p_path text,p_name text,p_mime text,p_size integer) returns uuid language plpgsql security invoker set search_path='' as $$declare result uuid;begin
 perform 1 from public.enquiries where id=p_enquiry and kind='quotation' and created_at>now()-interval '10 minutes' for update;if not found then raise exception 'Attachment window closed';end if;
 if p_path not like p_enquiry::text||'/%' or (select count(*) from public.msbd_attachments where enquiry_id=p_enquiry)>=3 then raise exception 'Attachment limit reached';end if;
 insert into public.msbd_attachments(enquiry_id,object_path,name,mime,size_bytes) values(p_enquiry,p_path,p_name,p_mime,p_size) returning id into result;return result;
end $$;
-- Explicit grants avoid inheriting permissive project defaults.
revoke all on private.msbd_roles,private.msbd_sequences,private.msbd_audit from public,anon,authenticated;
grant all on private.msbd_roles,private.msbd_sequences,private.msbd_audit to service_role;
grant usage,select on sequence private.msbd_audit_id_seq,public.msbd_events_id_seq to service_role;
revoke all on function private.msbd_role(uuid),private.msbd_number(text),private.msbd_calculate(jsonb,integer),private.msbd_invoice_balance(uuid),private.msbd_document_guard() from public,anon,authenticated;
grant execute on function private.msbd_role(uuid),private.msbd_number(text),private.msbd_calculate(jsonb,integer),private.msbd_invoice_balance(uuid) to service_role;
revoke all on function private.msbd_own_role(),private.msbd_client_access(uuid,boolean),public.my_business_role() from public,anon;
grant execute on function private.msbd_own_role(),private.msbd_client_access(uuid,boolean),public.my_business_role() to authenticated;
revoke all on function public.msbd_command(uuid,text,jsonb),public.msbd_client_response(uuid,uuid,text,boolean,text),public.msbd_invoice_balance(uuid,uuid),public.msbd_verification(uuid,text),public.msbd_record_pdf(uuid,text,text,text),public.msbd_claim_email_jobs(),public.msbd_queue_reminders(),public.msbd_roles_list(uuid),public.msbd_attachment_reserve(uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.msbd_command(uuid,text,jsonb),public.msbd_client_response(uuid,uuid,text,boolean,text),public.msbd_invoice_balance(uuid,uuid),public.msbd_verification(uuid,text),public.msbd_record_pdf(uuid,text,text,text),public.msbd_claim_email_jobs(),public.msbd_queue_reminders(),public.msbd_roles_list(uuid),public.msbd_attachment_reserve(uuid,text,text,text,integer) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('business-documents','business-documents',false,10485760,array['application/pdf']),('business-attachments','business-attachments',false,2097152,array['application/pdf','image/png','image/jpeg']);
-- No public/client Storage policies. Controlled routes validate document ownership
-- before server downloads, and upload permits are short lived and write-only.
create function private.msbd_document_state(d public.msbd_documents) returns text language plpgsql stable set search_path='' as $$declare b jsonb;begin
 if d.issued_at is null or d.status in ('cancelled','superseded','written_off') then return d.status;end if;
 if d.kind='quotation' and d.status in ('issued','sent','viewed') and d.due_date<current_date then return 'expired';end if;
 if d.kind='invoice' then b:=private.msbd_invoice_balance(d.id);return case when (b->>'outstanding_minor')::bigint=0 then 'paid' when (b->>'paid_minor')::bigint>0 then 'partially_paid' when d.due_date<current_date then 'overdue' else 'unpaid' end;end if;return d.status;
end $$;
create function public.msbd_report(p_actor uuid,p_from date default null,p_to date default null,p_client uuid default null,p_category text default null,p_status text default null,p_method text default null,p_staff uuid default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if coalesce(private.msbd_role(p_actor),'') not in ('super_admin','admin','finance','management') then raise exception 'Report access denied';end if;
 with docs as (select d.*,private.msbd_document_state(d) as current_status from public.msbd_documents d where (coalesce(private.msbd_role(p_actor),'')<>'management' or d.status not in ('draft','pending_approval')) and (p_from is null or d.created_at::date>=p_from) and (p_to is null or d.created_at::date<=p_to) and (p_client is null or d.client_id=p_client) and (p_category is null or d.content->>'category'=p_category) and (p_staff is null or d.created_by=p_staff)),filtered as (select * from docs where p_status is null or current_status=p_status),pay as (select p.* from public.msbd_payments p join public.msbd_documents d on d.id=p.invoice_id where p.confirmed_at is not null and (p_from is null or p.confirmed_at::date>=p_from) and (p_to is null or p.confirmed_at::date<=p_to) and (p_client is null or p.client_id=p_client) and (p_method is null or p.method=p_method) and (p_category is null or d.content->>'category'=p_category) and (p_staff is null or p.recorded_by=p_staff))
 select jsonb_build_object('clients',(select count(*) from public.msbd_clients where not archived),'documents',(select coalesce(jsonb_object_agg(k,n),'{}') from (select kind k,count(*) n from filtered group by kind) q),'statuses',(select coalesce(jsonb_object_agg(s,n),'{}') from (select current_status s,count(*) n from filtered group by current_status) q),'finance',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select currency,sum(amount_minor-refunded_minor) filter(where status='confirmed') as retained_minor,sum(amount_minor) as gross_confirmed_minor,sum(refunded_minor) as reversed_minor from pay group by currency) q),'receivables',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select content->>'currency' currency,sum((private.msbd_invoice_balance(id)->>'outstanding_minor')::bigint) outstanding_minor,sum((content->>'total_minor')::bigint) invoiced_minor from filtered where kind='invoice' and issued_at is not null and status not in ('cancelled','written_off') group by content->>'currency') q),'monthly',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select to_char(confirmed_at at time zone 'Africa/Lagos','YYYY-MM') as "month",currency,sum(amount_minor-refunded_minor) amount_minor from pay where status='confirmed' group by "month",currency order by "month" desc limit 24) q),'categories',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select coalesce(d.content->>'category','Uncategorised') category,p.currency,sum(p.amount_minor-p.refunded_minor) amount_minor from pay p join public.msbd_documents d on d.id=p.invoice_id where p.status='confirmed' group by category,p.currency) q),'quotation_monthly',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select to_char(created_at at time zone 'Africa/Lagos','YYYY-MM') as "month",count(*) count from filtered where kind='quotation' group by "month" order by "month" desc limit 24) q),'conversion',(select jsonb_build_object('issued',count(distinct regexp_replace(number,'-R[0-9]+$','')) filter(where issued_at is not null),'converted',count(distinct regexp_replace(number,'-R[0-9]+$','')) filter(where status='converted')) from filtered where kind='quotation'),'invoice_performance',(select coalesce(jsonb_object_agg(current_status,n),'{}') from (select current_status,count(*) n from filtered where kind='invoice' group by current_status) q),'outstanding_clients',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select c.name client,d.content->>'currency' currency,sum((private.msbd_invoice_balance(d.id)->>'outstanding_minor')::bigint) amount_minor from filtered d join public.msbd_clients c on c.id=d.client_id where d.kind='invoice' and d.issued_at is not null and d.status not in ('cancelled','written_off') group by c.name,d.content->>'currency' having sum((private.msbd_invoice_balance(d.id)->>'outstanding_minor')::bigint)>0 order by amount_minor desc limit 30) q),'requests',(select count(*) from public.enquiries where kind='quotation' and status in ('new','under_review')),'rows',(select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select d.number,d.kind,d.current_status,d.content->>'currency' currency,(d.content->>'total_minor')::bigint total_minor,d.due_date,d.issued_at,c.name client from filtered d join public.msbd_clients c on c.id=d.client_id order by d.created_at desc limit 5000) q),'rows_limited',(select count(*)>5000 from filtered)) into result;
 return result;
end $$;
revoke all on function private.msbd_document_state(public.msbd_documents) from public,anon,authenticated;
grant execute on function private.msbd_document_state(public.msbd_documents) to service_role;
revoke all on function public.msbd_report(uuid,date,date,uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.msbd_report(uuid,date,date,uuid,text,text,text,uuid) to service_role;
create function public.msbd_record_email_event(p_provider text,p_status text,p_at timestamptz) returns void language plpgsql security invoker set search_path='' as $$begin
 if p_status not in ('sent','delivered','delivery_delayed','bounced','complained','failed') then raise exception 'Invalid delivery status';end if;
 update public.msbd_email_jobs set provider_status=p_status,provider_event_at=p_at where provider_id=p_provider and (provider_status is null or provider_status not in ('bounced','complained')) and (provider_event_at is null or provider_event_at<=p_at);
end $$;
revoke all on function public.msbd_record_email_event(text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.msbd_record_email_event(text,text,timestamptz) to service_role;
-- Extend the existing atomic, spam-protected enquiry routine without changing its
-- limits, submission idempotency, outbox or legacy request references.
alter function public.submit_enquiry(jsonb,text) rename to msbd_legacy_submit_enquiry;
alter function public.msbd_legacy_submit_enquiry(jsonb,text) set schema private;
create function public.submit_enquiry(payload jsonb,rate_key text) returns text language plpgsql security invoker set search_path='' as $$declare result text;begin
 result:=private.msbd_legacy_submit_enquiry(payload,rate_key);
 update public.enquiries set details=details||jsonb_build_object('state',left(coalesce(payload->>'state',''),100),'budget',left(coalesce(payload->>'budget',''),120),'preferred_contact',left(coalesce(payload->>'preferred_contact',''),20)) where reference=result and not (details?'preferred_contact');
 return result;
end $$;
revoke all on function private.msbd_legacy_submit_enquiry(jsonb,text),public.submit_enquiry(jsonb,text) from public,anon,authenticated;
grant execute on function private.msbd_legacy_submit_enquiry(jsonb,text),public.submit_enquiry(jsonb,text) to service_role;
create table public.msbd_client_notes(id uuid primary key default gen_random_uuid(),client_id uuid not null references public.msbd_clients(id),body text not null check(length(body) between 2 and 5000),actor uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.msbd_client_notes enable row level security;
revoke all on public.msbd_client_notes from public,anon,authenticated;
grant select on public.msbd_client_notes to authenticated;
grant all on public.msbd_client_notes to service_role;
create policy msbd_notes_staff_read on public.msbd_client_notes for select to authenticated using(private.msbd_client_access(client_id,false));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('business-branding','business-branding',false,2097152,array['image/png','image/jpeg']);

create index msbd_reversal_payment on public.msbd_reversals(payment_id);

revoke all on function private.msbd_document_hash(jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.msbd_document_hash(jsonb,jsonb,jsonb) to service_role;

insert into public.msbd_templates(event,subject,body) values
('client_registered','New Mega Stride client registered','Client record {number} has been registered. Review it in Business Desk.'),
('approval_required','Business document approval required','Document {number} is awaiting approval in Business Desk.'),
('document_approved','Business document approved','Document {number} has been approved. Review it before issue.'),
('document_viewed','A client opened their document','Document {number} was opened through the authenticated client download.'),
('quotation_accepted','Client accepted a quotation','The client submitted an explicit acceptance of quotation {number}. Review the exact version and acceptance record.'),
('quotation_rejected','Client rejected a quotation','The client rejected quotation {number}. Review the response in Business Desk.'),
('quotation_revision_requested','Client requested a revision','The client requested a revision of quotation {number}. The issued version is preserved.'),
('document_status_changed','Business document status update','The status of document {number} has changed. Check its verification record or secure client portal.'),
('quotation_expiring','Quotation validity reminder','Quotation {number} is approaching or past its validity date. Review it in Business Desk.'),
('unanswered_request','Quotation enquiry follow-up','Request {number} still needs follow-up. Review it in Business Desk.');
create function public.msbd_record_view(p_actor uuid,p_document uuid) returns void language plpgsql security invoker set search_path='' as $$declare d public.msbd_documents;begin
 if private.msbd_role(p_actor) is not null then return;end if;
 select * into d from public.msbd_documents where id=p_document and issued_at is not null and status in ('issued','sent') for update;if not found then return;end if;
 if not exists(select 1 from public.msbd_clients c where c.id=d.client_id and c.portal_user=p_actor and private.msbd_verified_email(p_actor)=c.email) then raise exception 'Client access denied';end if;
 update public.msbd_documents set status='viewed' where id=d.id;
 insert into public.msbd_events(document_id,client_id,actor,action) values(d.id,d.client_id,p_actor,'document_viewed');
 if coalesce((select (profile->>'notifications_enabled')::boolean from public.msbd_settings where id),false) then
  insert into public.msbd_email_jobs(document_id,client_id,context,recipient,event,template,dedupe_key) select d.id,d.client_id,jsonb_build_object('number',d.number,'internal',true),s.profile->>'email','document_viewed',jsonb_build_object('subject',t.subject,'body',t.body),d.id::text||'/viewed' from public.msbd_settings s cross join public.msbd_templates t where s.id and t.event='document_viewed' and t.enabled on conflict(dedupe_key) do nothing;
 end if;
end $$;
revoke all on function public.msbd_record_view(uuid,uuid) from public,anon,authenticated;
grant execute on function public.msbd_record_view(uuid,uuid) to service_role;

create function public.msbd_audit_list(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$begin
 if coalesce(private.msbd_role(p_actor),'')<>'super_admin' then raise exception 'Owner only';end if;
 return coalesce((select jsonb_agg(to_jsonb(q)) from (select id,actor,action,entity_id,reason,created_at from private.msbd_audit order by id desc limit 100) q),'[]');
end $$;
revoke all on function public.msbd_audit_list(uuid) from public,anon,authenticated;
grant execute on function public.msbd_audit_list(uuid) to service_role;
create function private.msbd_staff_directory_identities(p_actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if current_setting('role',true)<>'service_role' or coalesce(private.msbd_role(p_actor),'') not in ('super_admin','admin','finance','management') then raise exception 'Staff directory denied';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',coalesce(p.display_name,u.email),'email',u.email,'role',private.msbd_role(u.id))) from auth.users u left join public.profiles p on p.id=u.id where private.msbd_role(u.id) is not null),'[]');
end $$;
revoke all on function private.msbd_staff_directory_identities(uuid) from public,anon,authenticated;
grant execute on function private.msbd_staff_directory_identities(uuid) to service_role;
create function public.msbd_staff_directory(p_actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.msbd_staff_directory_identities(p_actor);$$;
revoke all on function public.msbd_staff_directory(uuid) from public,anon,authenticated;
grant execute on function public.msbd_staff_directory(uuid) to service_role;
create function private.msbd_readable_document_state(p_id uuid) returns text language plpgsql stable security definer set search_path='' as $$declare d public.msbd_documents;r text:=private.msbd_role((select auth.uid()));begin
 if r is null then return null;end if;
 select * into d from public.msbd_documents where id=p_id;if not found or not private.msbd_client_access(d.client_id,false) or (r='management' and d.status in ('draft','pending_approval')) then return null;end if;
 return private.msbd_document_state(d);
end $$;
revoke all on function private.msbd_readable_document_state(uuid) from public,anon;
grant execute on function private.msbd_readable_document_state(uuid) to authenticated;
create function public.msbd_document_list(p_kind text,p_state text default null,p_client uuid default null,p_query text default '',p_page integer default 1) returns jsonb language plpgsql stable security invoker set search_path='' as $$declare result jsonb;begin
 if (select private.msbd_own_role()) is null or coalesce(p_kind,'') not in ('quotation','invoice','receipt','credit_note','statement','order') or p_page not between 1 and 100000 or length(p_query)>100 then raise exception 'Document list unavailable';end if;
 with filtered as (select d.*,private.msbd_readable_document_state(d.id) as current_status from public.msbd_documents d where d.kind=p_kind and (p_client is null or d.client_id=p_client) and (p_query='' or d.number ilike '%'||p_query||'%' or d.content->>'title' ilike '%'||p_query||'%')),matching as (select * from filtered where p_state is null or p_state='' or current_status=p_state),paged as (select * from matching order by created_at desc offset (p_page-1)*25 limit 25)
 select jsonb_build_object('rows',(select coalesce(jsonb_agg(to_jsonb(paged)),'[]') from paged),'total',(select count(*) from matching),'page',p_page) into result;return result;
end $$;
revoke all on function public.msbd_document_list(text,text,uuid,text,integer) from public,anon;
grant execute on function public.msbd_document_list(text,text,uuid,text,integer) to authenticated;
