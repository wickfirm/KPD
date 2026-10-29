"use client";

import { setProjectHomepage } from "../actions";

/// Ticks immediately from the Developments list. An empty link is not a navigation.
export function HomepageToggle({ id, shown }: { id: string; shown: boolean }) {
  return (
    <form action={setProjectHomepage}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="showOnHomepage" value={shown ? "on" : "off"} />
      <label className="cms-check">
        <input
          type="checkbox"
          defaultChecked={shown}
          onChange={(event) => {
            const form = event.currentTarget.form;
            const field = form?.elements.namedItem("showOnHomepage");
            if (field instanceof HTMLInputElement) field.value = event.currentTarget.checked ? "on" : "off";
            form?.requestSubmit();
          }}
        />
        <span>Show on homepage</span>
      </label>
    </form>
  );
}
