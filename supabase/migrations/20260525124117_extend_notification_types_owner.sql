alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'admin_new_review',
    'review_approved',
    'review_rejected',
    'admin_new_claim',
    'claim_approved',
    'claim_rejected',
    'owner_replied',
    'admin_review_flagged'
  ));;
