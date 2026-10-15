<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Seller rotation happens only in the `pick_seller` SQL function (locks store row) called from `/redirect/$loja/$tipo`; why: atomic round-robin and sellers never exposed publicly.
- Public store reads go through server fns using a publishable client; admin CRUD uses browser client under RLS with `has_role`.
