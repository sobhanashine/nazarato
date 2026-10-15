-- Destructive rollback for this dedicated D1 only; export it first if populated.
DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS otp_challenges;
DROP TABLE IF EXISTS rate_limits;
