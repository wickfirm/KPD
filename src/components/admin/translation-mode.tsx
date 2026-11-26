"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Locale } from "@/lib/locales";
import { englishFormFields, type EnglishFormField } from "@/lib/translations/form-translation";

/// How a form says which of its boxes are text: a list of field names, or a
/// rule for a form whose field names are built at run time.
export type TextFieldRule = readonly string[] | ((name: string) => boolean);

type TextControl = HTMLInputElement | HTMLTextAreaElement;

type Options = {
  lang: Locale;
  /// Id of the read-only English editor beside the tab (EnglishCopy).
  englishId: string;
  textFields: TextFieldRule;
  /// Labels of boxes a repeater renders that look like text but are not (an
  /// icon name, a link, a coordinate): shared with English.
  sharedLabels?: readonly string[];
  /// Further hidden fields the translation's save needs (the editor's own address).
  fields?: Readonly<Record<string, string>>;
};

const NO_SHARED_LABELS: readonly string[] = [];
const NO_FIELDS: Readonly<Record<string, string>> = {};

/// A box a translator writes in: a text field or a text area. Checkboxes, file
/// pickers, numbers, dates and addresses have their own input types and are
/// never text.
function isTextBox(control: Element): control is TextControl {
  if (control instanceof HTMLTextAreaElement) return true;
  if (!(control instanceof HTMLInputElement)) return false;
  return control.type === "" || control.type === "text" || control.type === "search";
}

/// The box a field's note goes under.
function fieldBox(control: HTMLElement) {
  return control.closest<HTMLElement>(".cms-field, .cms-check, .cms-media-picker");
}

/// The wording of a box's own label ("Icon", "Position"), for a repeater's
/// boxes, which carry no field name.
function labelOf(control: HTMLElement) {
  return (control.closest("label")?.querySelector(":scope > span")?.textContent ?? "").trim();
}

/// The box a file field keeps its link in ("Use an existing file link"): a
/// link, not text.
function isAssetLink(control: HTMLElement) {
  return control.parentElement?.matches("details.cms-advanced-input") ?? false;
}

/// A button in the row that holds the form's own Save button is one of the
/// form's own actions (Save, "Preview with unsaved changes"): it must keep working.
function isOwnActionButton(control: HTMLElement) {
  const row = control.closest(".cms-actions, .cms-save-row");
  return Boolean(row?.querySelector('button[type="submit"]'));
}

/// Turns an editor's form into its Arabic or Japanese tab. The form itself is
/// the English editor with the translation's text in it; this:
/// - locks everything that is not text (shared with English) and says so;
/// - puts the English under every text box that is translated, and marks the
///   ones that still show English;
/// - writes Arabic boxes right-to-left;
/// - carries the English form along as hidden fields, so the save compares the
///   translation with exactly the wording the editor saw (see form-translation.ts).
///
/// It is a hook, not a component, and it only ever changes attributes: the
/// English tab renders the editor's markup exactly as it always did, with no
/// extra element anywhere (React derives the ids of the editor's controls from
/// the elements around them, so even an empty extra element would change them).
/// The hidden fields it adds are created in the page, not rendered by React.
export function useTranslationMode(formRef: RefObject<HTMLFormElement | null>, { lang, englishId, textFields, sharedLabels = NO_SHARED_LABELS, fields = NO_FIELDS }: Options): void {
  // The extra fields are read when the effect runs, not when it is decided
  // whether to: an object made on each render must not re-run it each time.
  const fieldsNow = useRef(fields);
  fieldsNow.current = fields;
  useLayoutEffect(() => {
    const form = formRef.current;
    // English is the editor itself. The read-only English copy beside a tab is
    // the same component, and is never a translation form of its own.
    if (lang === "en" || !form || form.closest("[data-english-copy]")) return;
    const englishForm = document.getElementById(englishId)?.querySelector("form");
    if (!englishForm) return;
    const rule = (name: string) => name === "" || (typeof textFields === "function" ? textFields(name) : textFields.includes(name));
    const isText = (control: Element): control is TextControl =>
      isTextBox(control) && !isAssetLink(control) && rule(control.name) && !(control.name === "" && sharedLabels.includes(labelOf(control)));
    form.classList.add("cms-form--translation");
    // The English of every text box, by field and position: a repeater's boxes
    // carry no name, so the second nameless box matches the second nameless one.
    const englishOf = new Map<string, string[]>();
    for (const control of Array.from(englishForm.elements)) {
      if (!isText(control)) continue;
      const listed = englishOf.get(control.name);
      if (listed) listed.push(control.value);
      else englishOf.set(control.name, [control.value]);
    }
    const seen = new Map<string, number>();
    const shared = (control: HTMLElement) => {
      fieldBox(control)?.setAttribute("data-shared", "");
      // The list or section a locked button belongs to says so once.
      control.closest(".cms-list-editor, .cms-member-list, section.cms-editor-section")?.setAttribute("data-shared-list", "");
    };

    const apply = () => {
      seen.clear();
      for (const control of Array.from(form.elements)) {
        // The form's own Save button is left alone: it is the one thing that must work.
        if (((control instanceof HTMLInputElement || control instanceof HTMLButtonElement) && (control.type === "hidden" || control.type === "submit")) || control instanceof HTMLOutputElement || control instanceof HTMLFieldSetElement) continue;
        if (isText(control)) {
          const name = control.name;
          const index = seen.get(name) ?? 0;
          seen.set(name, index + 1);
          const text = englishOf.get(name)?.[index];
          const box = fieldBox(control);
          control.setAttribute("data-translate", "");
          if (lang === "ar") control.setAttribute("dir", "rtl");
          if (text === undefined || !text.trim()) {
            // English shows nothing in this box, so there is nothing to translate.
            control.readOnly = true;
            box?.setAttribute("data-shared", "");
          } else {
            control.readOnly = false;
            box?.setAttribute("data-en", text);
            box?.setAttribute("data-translated", control.value.trim() === text.trim() ? "0" : "1");
          }
          continue;
        }
        // Everything else is shared with English: it keeps its value (so the
        // form still submits it) and can no longer be changed here.
        if (control instanceof HTMLButtonElement) {
          if (isOwnActionButton(control)) continue;
          control.setAttribute("inert", "");
        } else if (control instanceof HTMLSelectElement || (control instanceof HTMLInputElement && ["checkbox", "radio", "file"].includes(control.type))) {
          control.setAttribute("inert", "");
          // A file picker is opened from its label too: lock the whole picker.
          if (control.type === "file") control.closest(".cms-media-picker")?.setAttribute("inert", "");
        } else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) control.readOnly = true;
        else continue;
        shared(control);
      }
      for (const handle of form.querySelectorAll(".cms-drag-handle")) handle.setAttribute("inert", "");
    };
    apply();

    // The language of the tab and the English form travel with the save as
    // hidden fields. They are created here, at the end of the form, and taken
    // out again when the tab goes away.
    const carried: HTMLInputElement[] = [];
    const carry = (name: string, value: string) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
      carried.push(input);
    };
    carry("lang", lang);
    for (const [name, value] of Object.entries(fieldsNow.current)) carry(name, value);
    const englishFields: EnglishFormField[] = englishFormFields(new FormData(englishForm));
    for (const field of englishFields) carry(field.name, field.value);

    // A repeater can render new boxes; they get the same treatment.
    const observer = new MutationObserver(apply);
    observer.observe(form, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      form.classList.remove("cms-form--translation");
      for (const input of carried) input.remove();
    };
  }, [formRef, lang, englishId, textFields, sharedLabels]);
}
