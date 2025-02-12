-- Create documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content jsonb,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table documents enable row level security;

-- Create policies
create policy "Users can create their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row
  execute procedure handle_updated_at(); 