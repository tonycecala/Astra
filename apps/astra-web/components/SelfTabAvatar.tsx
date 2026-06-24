"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GravatarState = {
  email: string | null;
  index: number;
  urls: string[];
};

type SelfTabAvatarProps = {
  className?: string;
  email: string | null;
  initial: string;
  size?: number;
};

function md5Hex(input: string) {
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }

  function rotateLeft(value: number, shift: number) {
    return (value << shift) | (value >>> (32 - shift));
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return add32(rotateLeft(add32(add32(a, q), add32(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const bytes = new TextEncoder().encode(input);
  const paddedLength = (((bytes.length + 8) >>> 6) + 1) * 16;
  const words = new Array<number>(paddedLength).fill(0);
  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] |= bytes[index] << ((index % 4) * 8);
  }
  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
  words[paddedLength - 2] = bytes.length * 8;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let index = 0; index < words.length; index += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, words[index], 7, -680876936);
    d = ff(d, a, b, c, words[index + 1], 12, -389564586);
    c = ff(c, d, a, b, words[index + 2], 17, 606105819);
    b = ff(b, c, d, a, words[index + 3], 22, -1044525330);
    a = ff(a, b, c, d, words[index + 4], 7, -176418897);
    d = ff(d, a, b, c, words[index + 5], 12, 1200080426);
    c = ff(c, d, a, b, words[index + 6], 17, -1473231341);
    b = ff(b, c, d, a, words[index + 7], 22, -45705983);
    a = ff(a, b, c, d, words[index + 8], 7, 1770035416);
    d = ff(d, a, b, c, words[index + 9], 12, -1958414417);
    c = ff(c, d, a, b, words[index + 10], 17, -42063);
    b = ff(b, c, d, a, words[index + 11], 22, -1990404162);
    a = ff(a, b, c, d, words[index + 12], 7, 1804603682);
    d = ff(d, a, b, c, words[index + 13], 12, -40341101);
    c = ff(c, d, a, b, words[index + 14], 17, -1502002290);
    b = ff(b, c, d, a, words[index + 15], 22, 1236535329);

    a = gg(a, b, c, d, words[index + 1], 5, -165796510);
    d = gg(d, a, b, c, words[index + 6], 9, -1069501632);
    c = gg(c, d, a, b, words[index + 11], 14, 643717713);
    b = gg(b, c, d, a, words[index], 20, -373897302);
    a = gg(a, b, c, d, words[index + 5], 5, -701558691);
    d = gg(d, a, b, c, words[index + 10], 9, 38016083);
    c = gg(c, d, a, b, words[index + 15], 14, -660478335);
    b = gg(b, c, d, a, words[index + 4], 20, -405537848);
    a = gg(a, b, c, d, words[index + 9], 5, 568446438);
    d = gg(d, a, b, c, words[index + 14], 9, -1019803690);
    c = gg(c, d, a, b, words[index + 3], 14, -187363961);
    b = gg(b, c, d, a, words[index + 8], 20, 1163531501);
    a = gg(a, b, c, d, words[index + 13], 5, -1444681467);
    d = gg(d, a, b, c, words[index + 2], 9, -51403784);
    c = gg(c, d, a, b, words[index + 7], 14, 1735328473);
    b = gg(b, c, d, a, words[index + 12], 20, -1926607734);

    a = hh(a, b, c, d, words[index + 5], 4, -378558);
    d = hh(d, a, b, c, words[index + 8], 11, -2022574463);
    c = hh(c, d, a, b, words[index + 11], 16, 1839030562);
    b = hh(b, c, d, a, words[index + 14], 23, -35309556);
    a = hh(a, b, c, d, words[index + 1], 4, -1530992060);
    d = hh(d, a, b, c, words[index + 4], 11, 1272893353);
    c = hh(c, d, a, b, words[index + 7], 16, -155497632);
    b = hh(b, c, d, a, words[index + 10], 23, -1094730640);
    a = hh(a, b, c, d, words[index + 13], 4, 681279174);
    d = hh(d, a, b, c, words[index], 11, -358537222);
    c = hh(c, d, a, b, words[index + 3], 16, -722521979);
    b = hh(b, c, d, a, words[index + 6], 23, 76029189);
    a = hh(a, b, c, d, words[index + 9], 4, -640364487);
    d = hh(d, a, b, c, words[index + 12], 11, -421815835);
    c = hh(c, d, a, b, words[index + 15], 16, 530742520);
    b = hh(b, c, d, a, words[index + 2], 23, -995338651);

    a = ii(a, b, c, d, words[index], 6, -198630844);
    d = ii(d, a, b, c, words[index + 7], 10, 1126891415);
    c = ii(c, d, a, b, words[index + 14], 15, -1416354905);
    b = ii(b, c, d, a, words[index + 5], 21, -57434055);
    a = ii(a, b, c, d, words[index + 12], 6, 1700485571);
    d = ii(d, a, b, c, words[index + 3], 10, -1894986606);
    c = ii(c, d, a, b, words[index + 10], 15, -1051523);
    b = ii(b, c, d, a, words[index + 1], 21, -2054922799);
    a = ii(a, b, c, d, words[index + 8], 6, 1873313359);
    d = ii(d, a, b, c, words[index + 15], 10, -30611744);
    c = ii(c, d, a, b, words[index + 6], 15, -1560198380);
    b = ii(b, c, d, a, words[index + 13], 21, 1309151649);
    a = ii(a, b, c, d, words[index + 4], 6, -145523070);
    d = ii(d, a, b, c, words[index + 11], 10, -1120210379);
    c = ii(c, d, a, b, words[index + 2], 15, 718787259);
    b = ii(b, c, d, a, words[index + 9], 21, -343485551);

    a = add32(a, aa);
    b = add32(b, bb);
    c = add32(c, cc);
    d = add32(d, dd);
  }

  return [a, b, c, d]
    .map((word) => Array.from({ length: 4 }, (_, index) => ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, "0")).join(""))
    .join("");
}

function emailCandidates(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  const [localPart, domain] = normalized.split("@");
  const candidates = [normalized];
  if ((domain === "gmail.com" || domain === "googlemail.com") && localPart.includes("+")) {
    candidates.unshift(`${localPart.split("+")[0]}@${domain}`);
  }
  return Array.from(new Set(candidates));
}

async function gravatarUrlsForEmail(email: string, size: number) {
  if (!globalThis.crypto?.subtle) return [];
  const urls: string[] = [];
  for (const candidate of emailCandidates(email)) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(candidate));
    const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    urls.push(`https://www.gravatar.com/avatar/${sha256}?s=${size}&d=404&r=g`);
    urls.push(`https://www.gravatar.com/avatar/${md5Hex(candidate)}?s=${size}&d=404&r=g`);
  }
  return urls;
}

export function SelfTabAvatar({ className = "", email, initial, size = 20 }: SelfTabAvatarProps) {
  const [state, setState] = useState<GravatarState>({ email: null, index: 0, urls: [] });
  const gravatarUrl = state.email === email ? state.urls[state.index] ?? null : null;

  useEffect(() => {
    let active = true;
    if (!email) {
      return;
    }

    void gravatarUrlsForEmail(email, size).then((urls) => {
      if (active) {
        setState({ email, index: 0, urls });
      }
    });

    return () => {
      active = false;
    };
  }, [email, size]);

  return (
    <span className={`nav-avatar ${className}`.trim()} aria-hidden="true">
      {gravatarUrl ? (
        <Image
          alt=""
          height={size}
          onError={() => setState((current) => (current.index + 1 < current.urls.length ? { ...current, index: current.index + 1 } : { ...current, urls: [] }))}
          src={gravatarUrl}
          unoptimized
          width={size}
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
