import {
  $,
  B as B_1,
  Ft,
  J,
  Pt,
  Qn,
  Ut,
  _ as __1,
  b as b_1,
  h as h_1,
  k as k_1,
  mt,
  nr,
  o as o_1,
  tt,
  xt,
  y as y_1,
} from "./CoKk4mC0.js";
const te = {
  key: 0,
  class: `mt-0.5 text-[11px] leading-4 text-gray-400 dark:text-gray-500`,
};
const g = {
  class: `flex shrink-0`,
};
const _ = [`aria-label`];
const ne = [`aria-label`, `value`];
const v = [`aria-label`];
const y = Object.assign(
  k_1({
    __name: `NumberInput`,
    props: $(
      {
        title: {},
        min: {},
        max: {},
        default: {},
        step: {},
        compact: {
          type: Boolean,
        },
        description: {},
      },
      {
        modelValue: {
          default: 1,
        },
        modelModifiers: {},
      },
    ),
    emits: [`update:modelValue`],
    setup(e) {
      let t = Ft(e, `modelValue`, {
        get(e) {
          return Number(e) || 0;
        },
        set(e) {
          return Number(e) || 0;
        },
      });
      let r = e;
      if (r.default === undefined) {
        t.value = Number(t.value);
      } else {
        t.value = Number(r.default);
      }
      let onInput = (e) => {
        let e_target = e.target;
        let n_value = e_target.value;
        if (n_value === ``) {
          t.value = r.min || 0;
          return;
        }
        let a = Number(n_value);
        if (isNaN(a)) {
          e_target.value = String(t.value);
          return;
        }
        let o = a;
        if (r.max !== undefined && o > r.max) {
          o = r.max;
        }
        if (r.min !== undefined && o < r.min) {
          o = r.min;
        }
        t.value = o;
      };
      let o = () => {
        let e = r.step ?? 1;
        let n = Number(t.value) + e;
        if (!(r.max !== undefined && n > r.max)) {
          t.value = n;
        }
      };
      let l = () => {
        let e = r.step ?? 1;
        let n = Number(t.value) - e;
        if (!(r.min !== undefined && n < r.min)) {
          t.value = n;
        }
      };
      return (n, r) => {
        mt();
        return b_1(
          `div`,
          {
            class: Qn([
              `flex items-center justify-between`,
              e.compact
                ? `gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/70`
                : ``,
            ]),
          },
          [
            __1(
              `div`,
              {
                class: Qn([
                  `min-w-0`,
                  e.compact ? `` : `font-bold text-gray-700 dark:text-gray-200`,
                ]),
              },
              [
                __1(
                  `div`,
                  {
                    class: Qn(
                      e.compact
                        ? `text-xs font-semibold text-gray-700 dark:text-gray-200`
                        : ``,
                    ),
                  },
                  nr(e.title),
                  3,
                ),
                e.compact && e.description
                  ? (mt(), b_1(`div`, te, nr(e.description), 1))
                  : y_1(``, true),
              ],
              2,
            ),
            __1(`div`, g, [
              __1(
                `button`,
                {
                  type: `button`,
                  "aria-label": `Decrease ${e.title}`,
                  class: Qn([
                    `select-none cursor-pointer rounded-l border bg-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800`,
                    e.compact ? `px-3 py-1.5 text-sm` : `px-4 py-2`,
                  ]),
                  onClick: l,
                },
                ` - `,
                10,
                _,
              ),
              __1(
                `input`,
                {
                  "aria-label": e.title,
                  value: t.value,
                  class: Qn([
                    `border-y border-gray-200 text-center focus:outline-hidden focus:ring-0 dark:border-gray-700 dark:bg-gray-900`,
                    e.compact ? `w-16 px-2 py-1.5 text-sm` : `p-2`,
                  ]),
                  type: `text`,
                  onInput,
                },
                null,
                42,
                ne,
              ),
              __1(
                `button`,
                {
                  type: `button`,
                  "aria-label": `Increase ${e.title}`,
                  class: Qn([
                    `select-none cursor-pointer rounded-r border bg-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800`,
                    e.compact ? `px-3 py-1.5 text-sm` : `px-4 py-2`,
                  ]),
                  onClick: o,
                },
                ` + `,
                10,
                v,
              ),
            ]),
          ],
          2,
        );
      };
    },
  }),
  {
    __name: `NumberInput`,
  },
);
const b = {
  class: `flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/70 sm:flex-row sm:items-center sm:justify-between`,
};
const x = {
  class: `min-w-0`,
};
const S = {
  class: `text-xs font-semibold text-gray-700 dark:text-gray-200`,
};
const C = {
  key: 0,
  class: `mt-0.5 text-[11px] leading-4 text-gray-400 dark:text-gray-500`,
};
const w = Object.assign(
  k_1({
    __name: `SettingsField`,
    props: {
      title: {},
      description: {},
      controlClass: {},
    },
    setup(e) {
      return (t, n) => {
        mt();
        return b_1(`div`, b, [
          __1(`div`, x, [
            __1(`div`, S, nr(e.title), 1),
            e.description
              ? (mt(), b_1(`div`, C, nr(e.description), 1))
              : y_1(``, true),
          ]),
          __1(
            `div`,
            {
              class: Qn(
                e.controlClass ||
                  `w-full min-w-0 shrink-0 sm:w-56 sm:max-w-[55%]`,
              ),
            },
            [xt(t.$slots, `default`)],
            2,
          ),
        ]);
      };
    },
  }),
  {
    __name: `SettingsField`,
  },
);
const T = Symbol(`headlessui.useid`);
let E = 0;
const re = Pt ?? (() => J(T, () => `${++E}`)());
function D(e) {
  if (e == null || e.value == null) {
    return null;
  }
  let t = e.value.$el ?? e.value;
  if (t instanceof Node) {
    return t;
  }
  return null;
}
function O(e, t, ...n) {
  if (e in t) {
    let r = t[e];
    if (typeof r == `function`) {
      return r(...n);
    }
    return r;
  }
  let r = Error(
    `Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(
      t,
    )
      .map((e) => `"${e}"`)
      .join(`, `)}.`,
  );
  if (Error.captureStackTrace) {
    Error.captureStackTrace(r, O);
  }
  throw r;
}
const ae = (e, t, n) => {
  if (t in e) {
    return Object.defineProperty(e, t, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: n,
    });
  }
  return (e[t] = n);
};
const k = (e, t, n) => {
  ae(e, typeof t == `symbol` ? t : t + ``, n);
  return n;
};
const A = new (class {
  constructor() {
    k(this, `current`, this.detect());
    k(this, `currentId`, 0);
  }
  set(e) {
    if (this.current !== e) {
      this.currentId = 0;
      this.current = e;
    }
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === `server`;
  }
  get isClient() {
    return this.current === `client`;
  }
  detect() {
    if (typeof window > `u` || typeof document > `u`) {
      return `server`;
    }
    return `client`;
  }
})();
export function h(e) {
  if (A.isServer) {
    return null;
  }
  if (e instanceof Node) {
    return e.ownerDocument;
  }
  if (e != null && e.hasOwnProperty(`value`)) {
    let t = D(e);
    if (t) {
      return t.ownerDocument;
    }
  }
  return document;
}
const M = [
  `[contentEditable=true]`,
  `[tabindex]`,
  `a[href]`,
  `area[href]`,
  `button:not([disabled])`,
  `iframe`,
  `input:not([disabled])`,
  `select:not([disabled])`,
  `textarea:not([disabled])`,
]
  .map((e) => `${e}:not([tabindex='-1'])`)
  .join(`,`);
export var s = ((e) => {
  e[(e.First = 1)] = `First`;
  e[(e.Previous = 2)] = `Previous`;
  e[(e.Next = 4)] = `Next`;
  e[(e.Last = 8)] = `Last`;
  e[(e.WrapAround = 16)] = `WrapAround`;
  e[(e.NoScroll = 32)] = `NoScroll`;
  return e;
})(s || {});
export var u = ((e) => {
  e[(e.Error = 0)] = `Error`;
  e[(e.Overflow = 1)] = `Overflow`;
  e[(e.Success = 2)] = `Success`;
  e[(e.Underflow = 3)] = `Underflow`;
  return e;
})(u || {});
var F = ((e) => {
  e[(e.Previous = -1)] = `Previous`;
  e[(e.Next = 1)] = `Next`;
  return e;
})(F || {});
function I(e = document.body) {
  if (e == null) {
    return [];
  }
  return Array.from(e.querySelectorAll(M)).sort((e, t) =>
    Math.sign((e.tabIndex || 2 ** 53 - 1) - (t.tabIndex || 2 ** 53 - 1)),
  );
}
export var f = ((e) => {
  e[(e.Strict = 0)] = `Strict`;
  e[(e.Loose = 1)] = `Loose`;
  return e;
})(f || {});
export function m(e, t = 0) {
  return (
    e !== h(e)?.body &&
    O(t, {
      0() {
        return e.matches(M);
      },
      1() {
        let t = e;
        while (t !== null) {
          if (t.matches(M)) {
            return true;
          }
          t = t.parentElement;
        }
        return false;
      },
    })
  );
}
export function d(e) {
  let t = h(e);
  tt(() => {
    if (t && !m(t.activeElement, 0)) {
      V(e);
    }
  });
}
var B = ((e) => {
  e[(e.Keyboard = 0)] = `Keyboard`;
  e[(e.Mouse = 1)] = `Mouse`;
  return e;
})(B || {});
if (typeof window < `u` && typeof document < `u`) {
  document.addEventListener(
    `keydown`,
    (e) => {
      if (!(e.metaKey || e.altKey || e.ctrlKey)) {
        document.documentElement.dataset.headlessuiFocusVisible = ``;
      }
    },
    true,
  );
  document.addEventListener(
    `click`,
    (e) => {
      e.detail === 1
        ? delete document.documentElement.dataset.headlessuiFocusVisible
        : e.detail === 0 &&
          (document.documentElement.dataset.headlessuiFocusVisible = ``);
    },
    true,
  );
}
function V(e) {
  e?.focus({
    preventScroll: true,
  });
}
const H = [`textarea`, `input`].join(`,`);
function U(e) {
  return e?.matches?.(H) ?? false;
}
function W(e, t = (e) => e) {
  return e.slice().sort((e, n) => {
    let r = t(e);
    let i = t(n);
    if (r === null || i === null) {
      return 0;
    }
    let a = r.compareDocumentPosition(i);
    if (a & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    }
    if (a & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return 0;
  });
}
export function p(relativeTo, t) {
  return l(I(), t, {
    relativeTo,
  });
}
export function l(
  e,
  t,
  { sorted: n = true, relativeTo: r = null, skipElements: i = [] } = {},
) {
  let a =
    (Array.isArray(e)
      ? e.length > 0
        ? e[0].ownerDocument
        : document
      : e?.ownerDocument) ?? document;
  let o = Array.isArray(e) ? (n ? W(e) : e) : I(e);
  if (i.length > 0 && o.length > 1) {
    o = o.filter((e) => !i.includes(e));
  }
  r ??= a.activeElement;
  let s = (() => {
    if (t & 5) {
      return 1;
    }
    if (t & 10) {
      return -1;
    }
    throw Error(
      `Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last`,
    );
  })();
  let c = (() => {
    if (t & 1) {
      return 0;
    }
    if (t & 2) {
      return Math.max(0, o.indexOf(r)) - 1;
    }
    if (t & 4) {
      return Math.max(0, o.indexOf(r)) + 1;
    }
    if (t & 8) {
      return o.length - 1;
    }
    throw Error(
      `Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last`,
    );
  })();
  let l =
    t & 32
      ? {
          preventScroll: true,
        }
      : {};
  let u = 0;
  let o_length = o.length;
  let f;
  do {
    if (u >= o_length || u + o_length <= 0) {
      return 0;
    }
    let e = c + u;
    if (t & 16) {
      e = (e + o_length) % o_length;
    } else {
      if (e < 0) {
        return 3;
      }
      if (e >= o_length) {
        return 1;
      }
    }
    f = o[e];
    f?.focus(l);
    u += s;
  } while (f !== a.activeElement);
  if (t & 6 && U(f)) {
    f.select();
  }
  return 2;
}
export function o({ container, accept, walk, enabled }) {
  Ut(() => {
    let container_value = container.value;
    if (!container_value || (enabled !== undefined && !enabled.value)) {
      return;
    }
    let a = h(container);
    if (!a) {
      return;
    }
    let o = Object.assign((e) => accept(e), {
      acceptNode: accept,
    });
    let s = a.createTreeWalker(
      container_value,
      NodeFilter.SHOW_ELEMENT,
      o,
      false,
    );
    while (s.nextNode()) {
      walk(s.currentNode);
    }
  });
}
export var i = ((e) => {
  e[(e.None = 0)] = `None`;
  e[(e.RenderStrategy = 1)] = `RenderStrategy`;
  e[(e.Static = 2)] = `Static`;
  return e;
})(i || {});
var oe = ((e) => {
  e[(e.Unmount = 0)] = `Unmount`;
  e[(e.Hidden = 1)] = `Hidden`;
  return e;
})(oe || {});
function se({ visible = true, features = 0, ourProps, theirProps, ...rest }) {
  let a;
  let o = Z(theirProps, ourProps);
  let s = Object.assign(rest, {
    props: o,
  });
  if (visible || (features & 2 && o.static)) {
    return Y(s);
  }
  if (features & 1) {
    return O((a = o.unmount) == null || a ? 0 : 1, {
      0() {
        return null;
      },
      1() {
        return Y({
          ...rest,
          props: {
            ...o,
            hidden: true,
            style: {
              display: `none`,
            },
          },
        });
      },
    });
  }
  return Y(s);
}
function Y({ props, attrs, slots, slot, name }) {
  let { as, ...rest } = a(props, [`unmount`, `static`]);
  let c = slots.default?.(slot);
  let u = {};
  if (slot) {
    let e = false;
    let t = [];
    for (let [n, r] of Object.entries(slot)) {
      if (typeof r == `boolean`) {
        e = true;
      }
      if (r === true) {
        t.push(n);
      }
    }
    if (e) {
      u[`data-headlessui-state`] = t.join(` `);
    }
  }
  if (as === `template`) {
    c = X(c ?? []);
    if (Object.keys(rest).length > 0 || Object.keys(attrs).length > 0) {
      let [e, ...t] = c ?? [];
      if (!le(e) || t.length > 0) {
        throw Error(
          [
            `Passing props on "template"!`,
            ``,
            `The current component <${name} /> is rendering a "template".`,
            `However we need to passthrough the following props:`,
            Object.keys(rest)
              .concat(Object.keys(attrs))
              .map((e) => e.trim())
              .filter((e, t, n) => n.indexOf(e) === t)
              .sort((e, t) => e.localeCompare(t))
              .map((e) => `  - ${e}`).join(`
`),
            ``,
            `You can apply a few solutions:`,
            [
              'Add an `as="..."` prop, to ensure that we render an actual element instead of a "template".',
              `Render a single element as the child so that we can forward the props onto that element.`,
            ].map((e) => `  - ${e}`).join(`
`),
          ].join(`
`),
        );
      }
      let r = Z(e.props ?? {}, rest, u);
      let i = h_1(e, r, true);
      for (let e in r) {
        if (e.startsWith(`on`)) {
          i.props ||= {};
          i.props[e] = r[e];
        }
      }
      return i;
    }
    if (Array.isArray(c) && c.length === 1) {
      return c[0];
    }
    return c;
  }
  return B_1(
    as,
    {
      ...rest,
      ...u,
    },
    {
      default: () => c,
    },
  );
}
function X(e) {
  return e.flatMap((e) => {
    if (e.type === o_1) {
      return X(e.children);
    }
    return [e];
  });
}
function Z(...e) {
  if (e.length === 0) {
    return {};
  }
  if (e.length === 1) {
    return e[0];
  }
  let t = {};
  let n = {};
  for (let r of e) {
    for (let e in r) {
      if (e.startsWith(`on`) && typeof r[e] == `function`) {
        n[e] ?? (n[e] = []);
        n[e].push(r[e]);
      } else {
        t[e] = r[e];
      }
    }
  }
  if (t.disabled || t[`aria-disabled`]) {
    return Object.assign(
      t,
      Object.fromEntries(Object.keys(n).map((e) => [e, undefined])),
    );
  }
  for (let e in n) {
    Object.assign(t, {
      [e](t, ...r) {
        let i = n[e];
        for (let e of i) {
          if (t instanceof Event && t.defaultPrevented) {
            return;
          }
          e(t, ...r);
        }
      },
    });
  }
  return t;
}
function ce(e) {
  let t = {
    ...e,
  };
  for (let e in t) {
    t[e] === undefined && delete t[e];
  }
  return t;
}
export function a(e, t = []) {
  let n = {
    ...e,
  };
  for (let e of t) {
    e in n && delete n[e];
  }
  return n;
}
function le(e) {
  if (e == null) {
    return false;
  }
  return (
    typeof e.type == `string` ||
    typeof e.type == `object` ||
    typeof e.type == `function`
  );
}
export var t = ((e) => {
  e.Space = ` `;
  e.Enter = `Enter`;
  e.Escape = `Escape`;
  e.Backspace = `Backspace`;
  e.Delete = `Delete`;
  e.ArrowLeft = `ArrowLeft`;
  e.ArrowUp = `ArrowUp`;
  e.ArrowRight = `ArrowRight`;
  e.ArrowDown = `ArrowDown`;
  e.Home = `Home`;
  e.End = `End`;
  e.PageUp = `PageUp`;
  e.PageDown = `PageDown`;
  e.Tab = `Tab`;
  return e;
})(t || {});
export {
  O as _,
  w as b,
  W as c,
  A as g,
  se as n,
  ce as r,
  D as v,
  y as x,
  re as y,
};
