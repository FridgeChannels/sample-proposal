begin;

do $$
begin
  if (
    select count(*)
    from public.packages
    where code in ('PKG-PRESENCE', 'PKG-IHRA', 'PKG-PPM')
  ) <> 3 then
    raise exception 'Expected all three FridgeChannel packages before updating Year 1 prices';
  end if;
end
$$;

update public.packages
set year_1_price = case code
  when 'PKG-PRESENCE' then 4.99
  when 'PKG-IHRA' then 5.49
  when 'PKG-PPM' then 6.49
  else year_1_price
end
where code in ('PKG-PRESENCE', 'PKG-IHRA', 'PKG-PPM');

commit;
