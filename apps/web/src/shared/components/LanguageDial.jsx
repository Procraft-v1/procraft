"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const LANG_STORAGE_KEY = "procraft_lang";
// Order the dial cycles through. A trailing duplicate of the first language
// makes the wrap-around (ru -> uz) animate forward instead of snapping back.
const CYCLE = ["uz", "en", "ru"];
const FACES = [...CYCLE, CYCLE[0]];
const LABELS = { uz: "UZ", en: "EN", ru: "RU" };

/**
 * Circular language switcher. Each click advances to the next language; the
 * three faces (UZ/EN/RU) travel diagonally through a round, overflow-hidden
 * mask like a carousel, looping forever.
 */
export default function LanguageDial() {
  const { i18n } = useTranslation();
  const stripRef = useRef(null);
  const animatingRef = useRef(false);

  const initialIndex = Math.max(0, CYCLE.indexOf(i18n.language));
  const [active, setActive] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [withTransition, setWithTransition] = useState(true);

  // Keep the dial in sync if the language is changed elsewhere.
  useEffect(() => {
    const current = CYCLE.indexOf(i18n.language);
    if (current !== -1 && current !== active % CYCLE.length) {
      setWithTransition(false);
      setActive(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const handleClick = () => {
    if (animatingRef.current) {
      return;
    }
    animatingRef.current = true;
    const next = active + 1;
    setWithTransition(true);
    setActive(next);

    const lang = FACES[next];
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

  const handleTransitionEnd = () => {
    if (active >= CYCLE.length) {
      // Landed on the duplicate first face — reset to the real index instantly.
      setWithTransition(false);
      setActive(active % CYCLE.length);
    }
    animatingRef.current = false;
  };

  const offset = active * -100;

  return (
    <button
      type="button"
      className="dashboard-lang-dial"
      aria-label="Tilni almashtirish"
      onClick={handleClick}
    >
      <span
        ref={stripRef}
        className="dashboard-lang-dial__strip"
        style={{
          transform: `translate(${offset}%, ${offset}%)`,
          transition: withTransition
            ? "transform .5s cubic-bezier(.7,-0.18,.25,1.2)"
            : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {FACES.map((lang, index) => (
          <span
            key={`${lang}-${index}`}
            className="dashboard-lang-dial__face"
            style={{ transform: `translate(${index * 100}%, ${index * 100}%)` }}
          >
            {LABELS[lang]}
          </span>
        ))}
      </span>
    </button>
  );
}
