-- Add qr_mode column: 'rotating' (default, high security) or 'static' (printable)
alter table opportunities
  add column if not exists qr_mode text not null default 'rotating'
  check (qr_mode in ('rotating', 'static'));
