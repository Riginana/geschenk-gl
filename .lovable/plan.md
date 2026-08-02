Remove the large occasion hero banner from the Shop page.

1. Edit `src/routes/shop.index.tsx` and delete the `Reveal` block that renders the big banner image when `search.occasion` is set (currently lines 78–94, including the conditional `{search.occasion && (...)}` wrapper).
2. Verify the shop page still renders the title, filters, sort dropdown, and product grid correctly after the banner is gone.

No other pages or components are affected.