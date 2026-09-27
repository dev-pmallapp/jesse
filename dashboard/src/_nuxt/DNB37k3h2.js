import {
  D as D_1,
  E as E_1,
  Ht,
  Lt,
  On,
  Qn,
  Tn,
  Ut,
  _ as __1,
  b,
  bt as bt_1,
  ct as ct_1,
  er,
  et as et_1,
  ft as ft_1,
  g as g_1,
  jt as jt_1,
  k,
  mt as mt_1,
  nr,
  o as o_1,
  qt,
  rt as rt_1,
  tt as tt_1,
  v,
  vn,
  wn,
  wt as wt_1,
  xt as xt_1,
  y as y_1,
  z,
} from "./CoKk4mC0.js";
import { Yt, ct as ct_2, st as st_1 } from "./Cd-sGgPF.js";
import {
  C,
  _ as __2,
  b as b_2,
  c,
  d,
  f,
  h,
  i,
  l as l_1,
  o as o_2,
  s,
  t as t_1,
  v as v_2,
  x,
  y as y_2,
} from "./2k_QeT3T.js";
import { G, H, O as O_1, U, X, n as n_1, t as t_2 } from "./B8_r5oP7.js";
import { c as c_2 } from "./CioJR-lb.js";
import { r as r_1 } from "./BpBaBBm3.js";
import { g as g_2, r as r_2, u as u_1 } from "./DPJPAjQR.js";
import { i as i_2, r as r_3, t as t_3 } from "./ccMIPn_w.js";
import { n as n_2 } from "./OaeI3Ulg.js";
import { t as t_4 } from "./Cf85K_3V.js";
import {
  E as E_2,
  O as O_2,
  a,
  h as h_2,
  j,
  t as t_5,
  v as v_3,
  y as y_3,
} from "./CJNUlr67.js";
import { r as r_4 } from "./BKFC8tTN.js";
import { t as t_6 } from "./BqJ9I9M42.js";
import { t as t_7 } from "./JgXkd7uo2.js";
import { b as b_3, x as x_2 } from "./1uxVtXhK2.js";
import { t as t_8 } from "./BDNMzG2s2.js";
import { t as t_9 } from "./D_Sm39l5.js";
import { t as t_10 } from "./C9St-qHN.js";
import { t as t_11 } from "./25FdeeAd.js";
import { t as t_12 } from "./DcUUodPk.js";
import { t as t_13 } from "./CJ5SUZOH2.js";
const [Z, Pe] = j(`PopoverRoot`);
const Fe = k({
  __name: `PopoverRoot`,
  props: {
    defaultOpen: {
      type: Boolean,
      required: false,
      default: false,
    },
    open: {
      type: Boolean,
      required: false,
      default: undefined,
    },
    modal: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: [`update:open`],
  setup(e, { emit }) {
    let n = e;
    let r = emit;
    let { modal } = Tn(n);
    let s = g_2(n, `open`, r, {
      defaultValue: n.defaultOpen,
      passive: n.open === undefined,
    });
    Pe({
      contentId: ``,
      triggerId: ``,
      modal,
      open: s,
      onOpenChange: (e) => {
        s.value = e;
      },
      onOpenToggle: () => {
        s.value = !s.value;
      },
      triggerElement: vn(),
      hasCustomAnchor: vn(false),
    });
    return (e, t) => {
      mt_1();
      return v(On(l_1), null, {
        default: qt(() => [
          xt_1(e.$slots, `default`, {
            open: On(s),
            close: () => (s.value = false),
          }),
        ]),
        _: 3,
      });
    };
  },
});
const Anchor = k({
  __name: `PopoverAnchor`,
  props: {
    reference: {
      type: null,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
  },
  setup(e) {
    let t = e;
    r_2();
    let n = Z();
    rt_1(() => {
      n.hasCustomAnchor.value = true;
    });
    ft_1(() => {
      n.hasCustomAnchor.value = false;
    });
    return (e, n) => {
      mt_1();
      return v(
        On(c),
        er(z(t)),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
      );
    };
  },
});
const Le = k({
  __name: `PopoverArrow`,
  props: {
    width: {
      type: Number,
      required: false,
      default: 10,
    },
    height: {
      type: Number,
      required: false,
      default: 5,
    },
    rounded: {
      type: Boolean,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `svg`,
    },
  },
  setup(e) {
    let t = e;
    r_2();
    return (e, n) => {
      mt_1();
      return v(
        On(o_2),
        er(z(t)),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
      );
    };
  },
});
const Close = k({
  __name: `PopoverClose`,
  props: {
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `button`,
    },
  },
  setup(e) {
    let t = e;
    r_2();
    let n = Z();
    return (e, r) => {
      mt_1();
      return v(
        On(E_2),
        {
          type: e.as === `button` ? `button` : undefined,
          as: e.as,
          "as-child": t.asChild,
          onClick: (r[0] ||= (e) => On(n).onOpenChange(false)),
        },
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        8,
        [`type`, `as`, `as-child`],
      );
    };
  },
});
const ze = k({
  __name: `PopoverContentImpl`,
  props: {
    trapFocus: {
      type: Boolean,
      required: false,
    },
    memoDependencies: {
      type: Array,
      required: false,
    },
    side: {
      type: null,
      required: false,
    },
    sideOffset: {
      type: Number,
      required: false,
    },
    sideFlip: {
      type: Boolean,
      required: false,
    },
    align: {
      type: null,
      required: false,
    },
    alignOffset: {
      type: Number,
      required: false,
    },
    alignFlip: {
      type: Boolean,
      required: false,
    },
    avoidCollisions: {
      type: Boolean,
      required: false,
    },
    collisionBoundary: {
      type: null,
      required: false,
    },
    collisionPadding: {
      type: [Number, Object],
      required: false,
    },
    arrowPadding: {
      type: Number,
      required: false,
    },
    hideShiftedArrow: {
      type: Boolean,
      required: false,
    },
    sticky: {
      type: String,
      required: false,
    },
    hideWhenDetached: {
      type: Boolean,
      required: false,
    },
    positionStrategy: {
      type: String,
      required: false,
    },
    updatePositionStrategy: {
      type: String,
      required: false,
    },
    disableUpdateOnLayoutShift: {
      type: Boolean,
      required: false,
    },
    prioritizePosition: {
      type: Boolean,
      required: false,
    },
    reference: {
      type: null,
      required: false,
    },
    dir: {
      type: String,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
    disableOutsidePointerEvents: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    `escapeKeyDown`,
    `pointerDownOutside`,
    `focusOutside`,
    `interactOutside`,
    `openAutoFocus`,
    `closeAutoFocus`,
  ],
  setup(t, { emit }) {
    let r = t;
    let a = emit;
    let o = O_2(H(r, `trapFocus`, `disableOutsidePointerEvents`));
    let { forwardRef } = r_2();
    let c = Z();
    r_4();
    return (t, n) => {
      mt_1();
      return v(
        On(f),
        {
          "as-child": ``,
          loop: ``,
          trapped: t.trapFocus,
          onMountAutoFocus: (n[5] ||= (e) => a(`openAutoFocus`, e)),
          onUnmountAutoFocus: (n[6] ||= (e) => a(`closeAutoFocus`, e)),
        },
        {
          default: qt(() => [
            D_1(
              On(h),
              {
                "as-child": ``,
                "disable-outside-pointer-events": t.disableOutsidePointerEvents,
                onPointerDownOutside: (n[0] ||= (e) =>
                  a(`pointerDownOutside`, e)),
                onInteractOutside: (n[1] ||= (e) => a(`interactOutside`, e)),
                onEscapeKeyDown: (n[2] ||= (e) => a(`escapeKeyDown`, e)),
                onFocusOutside: (n[3] ||= (e) => a(`focusOutside`, e)),
                onDismiss: (n[4] ||= (e) => On(c).onOpenChange(false)),
              },
              {
                default: qt(() => [
                  D_1(
                    On(s),
                    et_1(On(o), {
                      id: On(c).contentId,
                      ref: On(forwardRef),
                      "data-state": On(c).open.value ? `open` : `closed`,
                      "aria-labelledby": On(c).triggerId,
                      style: {
                        "--reka-popover-content-transform-origin": `var(--reka-popper-transform-origin)`,
                        "--reka-popover-content-available-width": `var(--reka-popper-available-width)`,
                        "--reka-popover-content-available-height": `var(--reka-popper-available-height)`,
                        "--reka-popover-trigger-width": `var(--reka-popper-anchor-width)`,
                        "--reka-popover-trigger-height": `var(--reka-popper-anchor-height)`,
                      },
                      role: `dialog`,
                    }),
                    {
                      default: qt(() => [xt_1(t.$slots, `default`)]),
                      _: 3,
                    },
                    16,
                    [`id`, `data-state`, `aria-labelledby`],
                  ),
                ]),
                _: 3,
              },
              8,
              [`disable-outside-pointer-events`],
            ),
          ]),
          _: 3,
        },
        8,
        [`trapped`],
      );
    };
  },
});
const Be = k({
  __name: `PopoverContentModal`,
  props: {
    memoDependencies: {
      type: Array,
      required: false,
    },
    side: {
      type: null,
      required: false,
    },
    sideOffset: {
      type: Number,
      required: false,
    },
    sideFlip: {
      type: Boolean,
      required: false,
    },
    align: {
      type: null,
      required: false,
    },
    alignOffset: {
      type: Number,
      required: false,
    },
    alignFlip: {
      type: Boolean,
      required: false,
    },
    avoidCollisions: {
      type: Boolean,
      required: false,
    },
    collisionBoundary: {
      type: null,
      required: false,
    },
    collisionPadding: {
      type: [Number, Object],
      required: false,
    },
    arrowPadding: {
      type: Number,
      required: false,
    },
    hideShiftedArrow: {
      type: Boolean,
      required: false,
    },
    sticky: {
      type: String,
      required: false,
    },
    hideWhenDetached: {
      type: Boolean,
      required: false,
    },
    positionStrategy: {
      type: String,
      required: false,
    },
    updatePositionStrategy: {
      type: String,
      required: false,
    },
    disableUpdateOnLayoutShift: {
      type: Boolean,
      required: false,
    },
    prioritizePosition: {
      type: Boolean,
      required: false,
    },
    reference: {
      type: null,
      required: false,
    },
    dir: {
      type: String,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
    disableOutsidePointerEvents: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    `escapeKeyDown`,
    `pointerDownOutside`,
    `focusOutside`,
    `interactOutside`,
    `openAutoFocus`,
    `closeAutoFocus`,
  ],
  setup(e, { emit }) {
    let n = e;
    let r = emit;
    let a = Z();
    let o = vn(false);
    C(true);
    let s = x(n, r);
    let { forwardRef, currentElement } = r_2();
    y_2(currentElement);
    return (e, t) => {
      mt_1();
      return v(
        ze,
        et_1(On(s), {
          ref: On(forwardRef),
          "trap-focus": On(a).open.value,
          "disable-outside-pointer-events": ``,
          onCloseAutoFocus: (t[0] ||= Yt(
            (e) => {
              r(`closeAutoFocus`, e);
              o.value || On(a).triggerElement.value?.focus();
            },
            [`prevent`],
          )),
          onPointerDownOutside: (t[1] ||= (e) => {
            r(`pointerDownOutside`, e);
            let originalEvent = e.detail.originalEvent;
            let n =
              originalEvent.button === 0 && originalEvent.ctrlKey === true;
            let i = originalEvent.button === 2 || n;
            o.value = i;
          }),
          onFocusOutside: (t[2] ||= Yt(() => {}, [`prevent`])),
        }),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
        [`trap-focus`],
      );
    };
  },
});
const Ve = k({
  __name: `PopoverContentNonModal`,
  props: {
    memoDependencies: {
      type: Array,
      required: false,
    },
    side: {
      type: null,
      required: false,
    },
    sideOffset: {
      type: Number,
      required: false,
    },
    sideFlip: {
      type: Boolean,
      required: false,
    },
    align: {
      type: null,
      required: false,
    },
    alignOffset: {
      type: Number,
      required: false,
    },
    alignFlip: {
      type: Boolean,
      required: false,
    },
    avoidCollisions: {
      type: Boolean,
      required: false,
    },
    collisionBoundary: {
      type: null,
      required: false,
    },
    collisionPadding: {
      type: [Number, Object],
      required: false,
    },
    arrowPadding: {
      type: Number,
      required: false,
    },
    hideShiftedArrow: {
      type: Boolean,
      required: false,
    },
    sticky: {
      type: String,
      required: false,
    },
    hideWhenDetached: {
      type: Boolean,
      required: false,
    },
    positionStrategy: {
      type: String,
      required: false,
    },
    updatePositionStrategy: {
      type: String,
      required: false,
    },
    disableUpdateOnLayoutShift: {
      type: Boolean,
      required: false,
    },
    prioritizePosition: {
      type: Boolean,
      required: false,
    },
    reference: {
      type: null,
      required: false,
    },
    dir: {
      type: String,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
    disableOutsidePointerEvents: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    `escapeKeyDown`,
    `pointerDownOutside`,
    `focusOutside`,
    `interactOutside`,
    `openAutoFocus`,
    `closeAutoFocus`,
  ],
  setup(e, { emit }) {
    let n = e;
    let r = emit;
    let a = Z();
    let o = vn(false);
    let s = vn(false);
    let c = x(n, r);
    return (e, t) => {
      mt_1();
      return v(
        ze,
        et_1(On(c), {
          "trap-focus": false,
          "disable-outside-pointer-events": false,
          onCloseAutoFocus: (t[0] ||= (e) => {
            r(`closeAutoFocus`, e);
            if (!e.defaultPrevented) {
              o.value || On(a).triggerElement.value?.focus();
              e.preventDefault();
            }
            o.value = false;
            s.value = false;
          }),
          onInteractOutside: (t[1] ||= async (e) => {
            r(`interactOutside`, e);
            if (!e.defaultPrevented) {
              o.value = true;
              if (e.detail.originalEvent.type === `pointerdown`) {
                s.value = true;
              }
            }
            let e_target = e.target;
            if (On(a).triggerElement.value?.contains(e_target)) {
              e.preventDefault();
            }
            if (e.detail.originalEvent.type === `focusin` && s.value) {
              e.preventDefault();
            }
          }),
        }),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
      );
    };
  },
});
const Content = k({
  __name: `PopoverContent`,
  props: {
    forceMount: {
      type: Boolean,
      required: false,
    },
    memoDependencies: {
      type: Array,
      required: false,
    },
    side: {
      type: null,
      required: false,
    },
    sideOffset: {
      type: Number,
      required: false,
    },
    sideFlip: {
      type: Boolean,
      required: false,
    },
    align: {
      type: null,
      required: false,
    },
    alignOffset: {
      type: Number,
      required: false,
    },
    alignFlip: {
      type: Boolean,
      required: false,
    },
    avoidCollisions: {
      type: Boolean,
      required: false,
    },
    collisionBoundary: {
      type: null,
      required: false,
    },
    collisionPadding: {
      type: [Number, Object],
      required: false,
    },
    arrowPadding: {
      type: Number,
      required: false,
    },
    hideShiftedArrow: {
      type: Boolean,
      required: false,
    },
    sticky: {
      type: String,
      required: false,
    },
    hideWhenDetached: {
      type: Boolean,
      required: false,
    },
    positionStrategy: {
      type: String,
      required: false,
    },
    updatePositionStrategy: {
      type: String,
      required: false,
    },
    disableUpdateOnLayoutShift: {
      type: Boolean,
      required: false,
    },
    prioritizePosition: {
      type: Boolean,
      required: false,
    },
    reference: {
      type: null,
      required: false,
    },
    dir: {
      type: String,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
    disableOutsidePointerEvents: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    `escapeKeyDown`,
    `pointerDownOutside`,
    `focusOutside`,
    `interactOutside`,
    `openAutoFocus`,
    `closeAutoFocus`,
  ],
  setup(e, { emit }) {
    let n = e;
    let r = emit;
    let a = Z();
    let o = x(n, r);
    let { forwardRef } = r_2();
    a.contentId ||= v_2(undefined, `reka-popover-content`);
    return (e, t) => {
      mt_1();
      return v(
        On(__2),
        {
          present: e.forceMount || On(a).open.value,
        },
        {
          default: qt(() => [
            On(a).modal.value
              ? (mt_1(),
                v(
                  Be,
                  et_1(
                    {
                      key: 0,
                    },
                    On(o),
                    {
                      ref: On(forwardRef),
                    },
                  ),
                  {
                    default: qt(() => [xt_1(e.$slots, `default`)]),
                    _: 3,
                  },
                  16,
                ))
              : (mt_1(),
                v(
                  Ve,
                  et_1(
                    {
                      key: 1,
                    },
                    On(o),
                    {
                      ref: On(forwardRef),
                    },
                  ),
                  {
                    default: qt(() => [xt_1(e.$slots, `default`)]),
                    _: 3,
                  },
                  16,
                )),
          ]),
          _: 3,
        },
        8,
        [`present`],
      );
    };
  },
});
const Portal = k({
  __name: `PopoverPortal`,
  props: {
    to: {
      type: null,
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
    },
    defer: {
      type: Boolean,
      required: false,
    },
    forceMount: {
      type: Boolean,
      required: false,
    },
  },
  setup(e) {
    let t = e;
    return (e, n) => {
      mt_1();
      return v(
        On(d),
        er(z(t)),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
      );
    };
  },
});
const Trigger = k({
  __name: `PopoverTrigger`,
  props: {
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `button`,
    },
  },
  setup(t) {
    let n = t;
    let r = Z();
    let { forwardRef, currentElement } = r_2();
    r.triggerId ||= v_2(undefined, `reka-popover-trigger`);
    ct_1(() => {
      r.triggerElement.value = currentElement.value;
    });
    return (t, o) => {
      mt_1();
      return v(
        wt_1(On(r).hasCustomAnchor.value ? On(E_2) : On(c)),
        {
          "as-child": ``,
        },
        {
          default: qt(() => [
            D_1(
              On(E_2),
              {
                id: On(r).triggerId,
                ref: On(forwardRef),
                type: t.as === `button` ? `button` : undefined,
                "aria-haspopup": `dialog`,
                "aria-expanded": On(r).open.value,
                "aria-controls": On(r).contentId,
                "data-state": On(r).open.value ? `open` : `closed`,
                as: t.as,
                "as-child": n.asChild,
                onClick: On(r).onOpenToggle,
              },
              {
                default: qt(() => [xt_1(t.$slots, `default`)]),
                _: 3,
              },
              8,
              [
                `id`,
                `type`,
                `aria-expanded`,
                `aria-controls`,
                `data-state`,
                `as`,
                `as-child`,
                `onClick`,
              ],
            ),
          ]),
          _: 3,
        },
      );
    };
  },
});
const Ge = k({
  __name: `HoverCardArrow`,
  props: {
    width: {
      type: Number,
      required: false,
      default: 10,
    },
    height: {
      type: Number,
      required: false,
      default: 5,
    },
    rounded: {
      type: Boolean,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `svg`,
    },
  },
  setup(e) {
    let t = e;
    r_2();
    return (e, n) => {
      mt_1();
      return v(
        On(o_2),
        er(z(t)),
        {
          default: qt(() => [xt_1(e.$slots, `default`)]),
          _: 3,
        },
        16,
      );
    };
  },
});
const [Q, Ke] = j(`HoverCardRoot`);
const qe = k({
  __name: `HoverCardRoot`,
  props: {
    defaultOpen: {
      type: Boolean,
      required: false,
      default: false,
    },
    open: {
      type: Boolean,
      required: false,
      default: undefined,
    },
    openDelay: {
      type: Number,
      required: false,
      default: 700,
    },
    closeDelay: {
      type: Number,
      required: false,
      default: 300,
    },
    enableTouch: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: [`update:open`],
  setup(e, { emit }) {
    let n = e;
    let r = emit;
    let { openDelay, closeDelay, enableTouch } = Tn(n);
    r_2();
    let l = g_2(n, `open`, r, {
      defaultValue: n.defaultOpen,
      passive: n.open === undefined,
    });
    let u = vn(0);
    let d = vn(0);
    let f = vn(false);
    let p = vn(false);
    let isPointerInTransitRef = vn(false);
    let triggerElement = vn();
    function onOpen() {
      clearTimeout(d.value);
      u.value = window.setTimeout(() => (l.value = true), openDelay.value);
    }
    function onClose() {
      clearTimeout(u.value);
      if (!f.value && !p.value) {
        d.value = window.setTimeout(() => (l.value = false), closeDelay.value);
      }
    }
    function onDismiss() {
      clearTimeout(u.value);
      l.value = false;
    }
    Ke({
      open: l,
      onOpenChange(e) {
        l.value = e;
      },
      onOpen,
      onClose,
      onDismiss,
      hasSelectionRef: f,
      isPointerDownOnContentRef: p,
      isPointerInTransitRef,
      triggerElement,
      enableTouch,
    });
    return (e, t) => {
      mt_1();
      return v(On(l_1), null, {
        default: qt(() => [
          xt_1(e.$slots, `default`, {
            open: On(l),
          }),
        ]),
        _: 3,
      });
    };
  },
});
function $(e) {
  return (t) => {
    if (t.pointerType === `touch`) {
      return undefined;
    }
    return e();
  };
}
function Je(e) {
  let t = [];
  let n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (e) => {
      if (e.tabIndex >= 0) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
  while (n.nextNode()) {
    t.push(n.currentNode);
  }
  return t;
}
const Ye = k({
  __name: `HoverCardContentImpl`,
  props: {
    memoDependencies: {
      type: Array,
      required: false,
    },
    side: {
      type: null,
      required: false,
    },
    sideOffset: {
      type: Number,
      required: false,
    },
    sideFlip: {
      type: Boolean,
      required: false,
    },
    align: {
      type: null,
      required: false,
    },
    alignOffset: {
      type: Number,
      required: false,
    },
    alignFlip: {
      type: Boolean,
      required: false,
    },
    avoidCollisions: {
      type: Boolean,
      required: false,
    },
    collisionBoundary: {
      type: null,
      required: false,
    },
    collisionPadding: {
      type: [Number, Object],
      required: false,
    },
    arrowPadding: {
      type: Number,
      required: false,
    },
    hideShiftedArrow: {
      type: Boolean,
      required: false,
    },
    sticky: {
      type: String,
      required: false,
    },
    hideWhenDetached: {
      type: Boolean,
      required: false,
    },
    positionStrategy: {
      type: String,
      required: false,
    },
    updatePositionStrategy: {
      type: String,
      required: false,
    },
    disableUpdateOnLayoutShift: {
      type: Boolean,
      required: false,
    },
    prioritizePosition: {
      type: Boolean,
      required: false,
    },
    reference: {
      type: null,
      required: false,
    },
    dir: {
      type: String,
      required: false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
    },
  },
  emits: [
    `escapeKeyDown`,
    `pointerDownOutside`,
    `focusOutside`,
    `interactOutside`,
  ],
  setup(t, { emit }) {
    let r = t;
    let a = emit;
    let o = O_2(r);
    let { forwardRef, currentElement } = r_2();
    let u = Q();
    let { isPointerInTransit, onPointerExit } = b_2(
      u.triggerElement,
      currentElement,
    );
    G(u.isPointerInTransitRef, isPointerInTransit, {
      direction: `rtl`,
    });
    onPointerExit(() => {
      u.onClose();
    });
    let g = vn(false);
    let _;
    Ut((e) => {
      if (g.value) {
        let t = document.body;
        _ = t.style.userSelect || t.style.webkitUserSelect;
        t.style.userSelect = `none`;
        t.style.webkitUserSelect = `none`;
        e(() => {
          t.style.userSelect = _;
          t.style.webkitUserSelect = _;
        });
      }
    });
    function y() {
      g.value = false;
      u.isPointerDownOnContentRef.value = false;
      tt_1(() => {
        if (document.getSelection()?.toString() !== ``) {
          u.hasSelectionRef.value = true;
        }
      });
    }
    ct_1(() => {
      if (currentElement.value) {
        document.addEventListener(`pointerup`, y);
        Je(currentElement.value).forEach((e) =>
          e.setAttribute(`tabindex`, `-1`),
        );
      }
      u_1(
        window,
        `scroll`,
        (e) => {
          if (e.target?.contains(u.triggerElement.value)) {
            u.onDismiss();
          }
        },
        {
          capture: true,
        },
      );
    });
    ft_1(() => {
      document.removeEventListener(`pointerup`, y);
      u.hasSelectionRef.value = false;
      u.isPointerDownOnContentRef.value = false;
    });
    return (t, n) => {
      mt_1();
      return v(
        On(h),
        {
          "as-child": ``,
          "disable-outside-pointer-events": false,
          onEscapeKeyDown: (n[1] ||= (e) => a(`escapeKeyDown`, e)),
          onPointerDownOutside: (n[2] ||= (e) => a(`pointerDownOutside`, e)),
          onFocusOutside: (n[3] ||= Yt(
            (e) => a(`focusOutside`, e),
            [`prevent`],
          )),
          onDismiss: On(u).onDismiss,
        },
        {
          default: qt(() => [
            D_1(
              On(s),
              et_1(
                {
                  ...On(o),
                  ...t.$attrs,
                },
                {
                  ref: On(forwardRef),
                  "data-state": On(u).open.value ? `open` : `closed`,
                  style: {
                    userSelect: g.value ? `text` : undefined,
                    WebkitUserSelect: g.value ? `text` : undefined,
                    "--reka-hover-card-content-transform-origin": `var(--reka-popper-transform-origin)`,
                    "--reka-hover-card-content-available-width": `var(--reka-popper-available-width)`,
                    "--reka-hover-card-content-available-height": `var(--reka-popper-available-height)`,
                    "--reka-hover-card-trigger-width": `var(--reka-popper-anchor-width)`,
                    "--reka-hover-card-trigger-height": `var(--reka-popper-anchor-height)`,
                  },
                  onPointerdown: (n[0] ||= (e) => {
                    if (e.currentTarget.contains(e.target)) {
                      g.value = true;
                    }
                    On(u).hasSelectionRef.value = false;
                    On(u).isPointerDownOnContentRef.value = true;
                  }),
                },
              ),
              {
                default: qt(() => [xt_1(t.$slots, `default`)]),
                _: 3,
              },
              16,
              [`data-state`, `style`],
            ),
          ]),
          _: 3,
        },
        8,
        [`onDismiss`],
      );
    };
  },
});
const Xe = {
  Root: qe,
  Trigger: k({
    __name: `HoverCardTrigger`,
    props: {
      reference: {
        type: null,
        required: false,
      },
      asChild: {
        type: Boolean,
        required: false,
      },
      as: {
        type: null,
        required: false,
        default: `a`,
      },
    },
    setup(t) {
      let { forwardRef, currentElement } = r_2();
      let a = Q();
      a.triggerElement = currentElement;
      function o() {
        setTimeout(() => {
          if (!a.isPointerInTransitRef.value && !a.open.value) {
            a.onClose();
          }
        }, 0);
      }
      function onPointerup(e) {
        !a.enableTouch.value ||
          e.pointerType !== `touch` ||
          (a.open.value ? a.onDismiss() : a.onOpenChange(true));
      }
      return (t, r) => {
        mt_1();
        return v(
          On(c),
          {
            "as-child": ``,
            reference: t.reference,
          },
          {
            default: qt(() => [
              D_1(
                On(E_2),
                {
                  ref: On(forwardRef),
                  "as-child": t.asChild,
                  as: t.as,
                  "data-state": On(a).open.value ? `open` : `closed`,
                  "data-grace-area-trigger": ``,
                  onPointerenter: (r[0] ||= (e) => On($)(On(a).onOpen)(e)),
                  onPointerleave: (r[1] ||= (e) => On($)(o)(e)),
                  onPointerup,
                  onFocus: (r[2] ||= (e) => On(a).onOpen()),
                  onBlur: (r[3] ||= (e) => On(a).onClose()),
                },
                {
                  default: qt(() => [xt_1(t.$slots, `default`)]),
                  _: 3,
                },
                8,
                [`as-child`, `as`, `data-state`],
              ),
            ]),
            _: 3,
          },
          8,
          [`reference`],
        );
      };
    },
  }),
  Portal: k({
    __name: `HoverCardPortal`,
    props: {
      to: {
        type: null,
        required: false,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
      defer: {
        type: Boolean,
        required: false,
      },
      forceMount: {
        type: Boolean,
        required: false,
      },
    },
    setup(e) {
      let t = e;
      return (e, n) => {
        mt_1();
        return v(
          On(d),
          er(z(t)),
          {
            default: qt(() => [xt_1(e.$slots, `default`)]),
            _: 3,
          },
          16,
        );
      };
    },
  }),
  Content: k({
    __name: `HoverCardContent`,
    props: {
      forceMount: {
        type: Boolean,
        required: false,
      },
      memoDependencies: {
        type: Array,
        required: false,
      },
      side: {
        type: null,
        required: false,
      },
      sideOffset: {
        type: Number,
        required: false,
      },
      sideFlip: {
        type: Boolean,
        required: false,
      },
      align: {
        type: null,
        required: false,
      },
      alignOffset: {
        type: Number,
        required: false,
      },
      alignFlip: {
        type: Boolean,
        required: false,
      },
      avoidCollisions: {
        type: Boolean,
        required: false,
      },
      collisionBoundary: {
        type: null,
        required: false,
      },
      collisionPadding: {
        type: [Number, Object],
        required: false,
      },
      arrowPadding: {
        type: Number,
        required: false,
      },
      hideShiftedArrow: {
        type: Boolean,
        required: false,
      },
      sticky: {
        type: String,
        required: false,
      },
      hideWhenDetached: {
        type: Boolean,
        required: false,
      },
      positionStrategy: {
        type: String,
        required: false,
      },
      updatePositionStrategy: {
        type: String,
        required: false,
      },
      disableUpdateOnLayoutShift: {
        type: Boolean,
        required: false,
      },
      prioritizePosition: {
        type: Boolean,
        required: false,
      },
      reference: {
        type: null,
        required: false,
      },
      dir: {
        type: String,
        required: false,
      },
      asChild: {
        type: Boolean,
        required: false,
      },
      as: {
        type: null,
        required: false,
      },
    },
    emits: [
      `escapeKeyDown`,
      `pointerDownOutside`,
      `focusOutside`,
      `interactOutside`,
    ],
    setup(t, { emit }) {
      let r = x(t, emit);
      let { forwardRef } = r_2();
      let o = Q();
      return (t, n) => {
        mt_1();
        return v(
          On(__2),
          {
            present: t.forceMount || On(o).open.value,
          },
          {
            default: qt(() => [
              D_1(
                Ye,
                et_1(On(r), {
                  ref: On(forwardRef),
                  onPointerenter: (n[0] ||= (e) => On($)(On(o).onOpen)(e)),
                }),
                {
                  default: qt(() => [xt_1(t.$slots, `default`)]),
                  _: 3,
                },
                16,
              ),
            ]),
            _: 3,
          },
          8,
          [`present`],
        );
      };
    },
  }),
  Arrow: Ge,
};
const Ze = {
  Root: Fe,
  Trigger,
  Portal,
  Content,
  Arrow: Le,
  Close,
  Anchor,
};
const extend = {
  slots: {
    content: `bg-default shadow-lg rounded-md ring ring-default data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] origin-(--reka-popover-content-transform-origin) focus:outline-none pointer-events-auto`,
    arrow: `fill-bg stroke-default`,
  },
};
const $e = {
  __name: `UPopover`,
  props: {
    mode: {
      type: null,
      required: false,
      default: `click`,
    },
    content: {
      type: Object,
      required: false,
    },
    arrow: {
      type: [Boolean, Object],
      required: false,
    },
    portal: {
      type: [Boolean, String],
      required: false,
      skipCheck: true,
      default: true,
    },
    reference: {
      type: null,
      required: false,
    },
    dismissible: {
      type: Boolean,
      required: false,
      default: true,
    },
    class: {
      type: null,
      required: false,
    },
    ui: {
      type: null,
      required: false,
    },
    defaultOpen: {
      type: Boolean,
      required: false,
    },
    open: {
      type: Boolean,
      required: false,
    },
    modal: {
      type: Boolean,
      required: false,
    },
    openDelay: {
      type: Number,
      required: false,
      default: 0,
    },
    closeDelay: {
      type: Number,
      required: false,
      default: 0,
    },
    enableTouch: {
      type: Boolean,
      required: false,
    },
  },
  emits: [`close:prevent`, `update:open`],
  setup(t, { emit }) {
    let o = t;
    let s = emit;
    let c = Lt();
    let l = y_3(`popover`, o);
    let u = c_2();
    let d = v_3(
      l.mode === `hover`
        ? U(l, `defaultOpen`, `open`, `openDelay`, `closeDelay`, `enableTouch`)
        : U(l, `defaultOpen`, `open`, `modal`),
      s,
    );
    let m = i(wn(() => l.portal));
    let _ = wn(() =>
      ct_2(l.content, {
        side: `bottom`,
        sideOffset: 8,
        collisionPadding: 8,
      }),
    );
    let y = g_1(() => {
      if (l.dismissible) {
        return {
          pointerDownOutside: n_2,
        };
      }
      return [`interactOutside`, `escapeKeyDown`].reduce((e, t) => {
        e[t] = (e) => {
          e.preventDefault();
          s(`close:prevent`);
        };
        return e;
      }, {});
    });
    let b = wn(() =>
      ct_2(l.arrow, {
        rounded: true,
      }),
    );
    let S = g_1(() =>
      a({
        extend,
        ...(u.ui?.popover || {}),
      })({
        side: _.value.side,
      }),
    );
    let C = g_1(() => {
      if (l.mode === `hover`) {
        return Xe;
      }
      return Ze;
    });
    return (t, n) => {
      mt_1();
      return v(
        On(C).Root,
        er(z(On(d))),
        {
          default: qt(({ open, close }) => [
            c.default
              ? (mt_1(),
                v(
                  On(C).Trigger,
                  {
                    key: 0,
                    "as-child": ``,
                    class: Qn(On(l).class),
                  },
                  {
                    default: qt(() => [
                      xt_1(t.$slots, `default`, {
                        open,
                      }),
                    ]),
                    _: 2,
                  },
                  1032,
                  [`class`],
                ))
              : y_1(``, true),
            `Anchor` in C.value && c.anchor
              ? (mt_1(),
                v(
                  On(C).Anchor,
                  {
                    key: 1,
                    "as-child": ``,
                  },
                  {
                    default: qt(() => [
                      xt_1(
                        t.$slots,
                        `anchor`,
                        er(
                          z(
                            close
                              ? {
                                  close,
                                }
                              : {},
                          ),
                        ),
                      ),
                    ]),
                    _: 2,
                  },
                  1024,
                ))
              : y_1(``, true),
            D_1(
              On(C).Portal,
              er(z(On(m))),
              {
                default: qt(() => [
                  D_1(
                    On(h_2),
                    null,
                    {
                      default: qt(() => [
                        D_1(
                          On(C).Content,
                          et_1(
                            _.value,
                            {
                              reference:
                                On(l).reference ?? On(l).content?.reference,
                              "data-slot": `content`,
                              class: S.value.content({
                                class: [
                                  !c.default && On(l).class,
                                  On(l).ui?.content,
                                ],
                              }),
                            },
                            jt_1(y.value),
                          ),
                          {
                            default: qt(() => [
                              xt_1(
                                t.$slots,
                                `content`,
                                er(
                                  z(
                                    close
                                      ? {
                                          close,
                                        }
                                      : {},
                                  ),
                                ),
                              ),
                              On(l).arrow
                                ? (mt_1(),
                                  v(
                                    On(C).Arrow,
                                    et_1(
                                      {
                                        key: 0,
                                      },
                                      b.value,
                                      {
                                        "data-slot": `arrow`,
                                        class: S.value.arrow({
                                          class: On(l).ui?.arrow,
                                        }),
                                      },
                                    ),
                                    null,
                                    16,
                                    [`class`],
                                  ))
                                : y_1(``, true),
                            ]),
                            _: 2,
                          },
                          1040,
                          [`reference`, `class`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                ]),
                _: 2,
              },
              1040,
            ),
          ]),
          _: 3,
        },
        16,
      );
    };
  },
};
const et = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const tt = {
  class: `grid grid-cols-1 gap-2 xl:grid-cols-2`,
};
const nt = Object.assign(
  k({
    __name: `MonteCarloSettings`,
    props: {
      config: {},
      exchange: {},
    },
    setup(t) {
      let n = t_2();
      let r = g_1(() => [`free`, `guest`, ``].includes(n.plan));
      let a = g_1(() => {
        let e = n.systemInfo.cpu_cores || 1;
        if (r.value) {
          return Math.min(6, e);
        }
        return e;
      });
      return (o, s) => {
        let u = t_1;
        let d = b_3;
        let f = x_2;
        let p = t_7;
        let m = t_3;
        mt_1();
        return b(`div`, et, [
          D_1(
            p,
            {
              title: `Simulation`,
              flat: ``,
            },
            {
              default: qt(() => [
                __1(`div`, tt, [
                  D_1(
                    d,
                    {
                      title: `Warmup Candles`,
                      description: `Number of candles loaded before each simulation.`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          u,
                          {
                            modelValue: t.config.warm_up_candles,
                            "onUpdate:modelValue": (s[0] ||= (e) =>
                              (t.config.warm_up_candles = e)),
                            class: `w-full`,
                            type: `number`,
                            min: `0`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    f,
                    {
                      modelValue: t.config.cpu_cores,
                      "onUpdate:modelValue": (s[1] ||= (e) =>
                        (t.config.cpu_cores = e)),
                      compact: ``,
                      title: `CPU Cores (${t.config.cpu_cores} / ${On(n).systemInfo.cpu_cores})`,
                      description: On(r)
                        ? `Limited to 6 cores on the free plan.`
                        : `Processor cores used for simulations.`,
                      min: 1,
                      max: On(a),
                    },
                    null,
                    8,
                    [`modelValue`, `title`, `description`, `max`],
                  ),
                ]),
              ]),
              _: 1,
            },
          ),
          D_1(
            m,
            {
              modelValue: t.config.exchange,
              "onUpdate:modelValue": (s[2] ||= (e) => (t.config.exchange = e)),
              "exchange-name": t.exchange,
              flat: ``,
            },
            null,
            8,
            [`modelValue`, `exchange-name`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `SettingsMonteCarloSettings`,
  },
);
const rt = {
  class: `flex-1 flex flex-col p-3`,
};
const it = {
  class: `flex-1 rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-gray-950`,
};
const at = {
  key: 1,
  class: `space-y-3`,
};
const ot = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const st = {
  class: `flex items-center justify-between gap-4 px-4 py-3`,
};
const ct = {
  class: `px-4 py-4`,
};
const lt = {
  class: `grid grid-cols-1 gap-2 lg:grid-cols-2`,
};
const ut = {
  class: `space-y-4`,
};
const dt = {
  class: `flex items-center gap-2 mb-2`,
};
const ft = {
  class: `flex justify-between`,
};
const pt = {
  class: `flex gap-2 mb-3 flex-wrap`,
};
const mt = {
  class: `text-xs text-gray-500 dark:text-gray-400 mt-1`,
};
const ht = {
  key: 0,
};
const gt = {
  key: 0,
  class: `space-y-4`,
};
const _t = {
  class: `grid grid-cols-1 gap-2 lg:grid-cols-2`,
};
const vt = {
  key: 0,
  class: `space-y-4`,
};
const yt = {
  class: `px-4 py-3.5 space-y-3`,
};
const bt = {
  class: `flex items-center justify-between text-sm`,
};
const xt = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const St = {
  class: `flex items-center justify-between text-sm`,
};
const Ct = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const wt = {
  class: `flex items-center justify-between text-sm`,
};
const Tt = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const Et = {
  class: `text-sm`,
};
const Dt = {
  class: `mt-2 flex flex-wrap gap-1.5`,
};
const Ot = {
  key: 0,
  class: `rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`,
};
const kt = {
  key: 1,
  class: `rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`,
};
const At = {
  key: 2,
  class: `text-xs text-gray-400 dark:text-gray-500`,
};
const jt = t_8(
  k({
    __name: `index`,
    setup(r) {
      r_1({
        title: `Monte Carlo - Jesse`,
      });
      let a = st_1();
      let o = n_1();
      let s = g_1(() => o.form);
      let f = vn(false);
      let p = vn(true);
      let m = vn([]);
      let g = [
        {
          label: `1 Day`,
          value: 1440,
        },
        {
          label: `3 Days`,
          value: 4320,
        },
        {
          label: `7 Days`,
          value: 10080,
        },
        {
          label: `14 Days`,
          value: 20160,
        },
      ];
      let _ = vn(`custom`);
      let S = g_1(() => {
        if (typeof s.value.pipeline_type == `string`) {
          return s.value.pipeline_type;
        }
        return s.value.pipeline_type?.value || `moving_block_bootstrap`;
      });
      let C = g_1(() =>
        t_2().jesseSupportedTimeframes.map((e) => ({
          label: e,
          value: e,
        })),
      );
      ct_1(() => {
        o.ensureFormConfig();
        setTimeout(async () => {
          j();
          D();
          try {
            let e = (sessionStorage.getItem(`previousRoute`) || ``).match(
              /\/monte-carlo\/[^/]+$/,
            );
            sessionStorage.removeItem(`previousRoute`);
            if (!e) {
              let e = await o.getRunningSession();
              if (e) {
                P(`/monte-carlo/${e}`);
                return;
              }
            }
          } finally {
            p.value = false;
          }
        }, 50);
      });
      let E = X(() => {
        if (o.form.id) {
          o.saveState();
        }
      }, 1000);
      Ht(
        () => o.form,
        () => {
          E();
        },
        {
          deep: true,
        },
      );
      function D() {
        let batch_size = s.value.pipeline_params.batch_size;
        let t = g.find((t) => t.value === batch_size);
        _.value = t ? t.value : `custom`;
      }
      function O(e) {
        _.value = e;
        if (e !== `custom`) {
          s.value.pipeline_params.batch_size = e;
        }
      }
      Ht(
        () => s.value.pipeline_params.batch_size,
        (e) => {
          let t = g.find((t) => t.value === e);
          if (t && _.value !== t.value) {
            _.value = t.value;
          } else if (!t && _.value !== `custom`) {
            _.value = `custom`;
          }
        },
      );
      Ht(
        () => S.value,
        (e) => {
          if (e === `gaussian`) {
            let e = s.value.pipeline_params;
            if (e.close_sigma === undefined || e.close_sigma === null) {
              e.close_sigma = 0.001;
            }
            if (e.high_sigma === undefined || e.high_sigma === null) {
              e.high_sigma = 0.0001;
            }
            if (e.low_sigma === undefined || e.low_sigma === null) {
              e.low_sigma = 0.0001;
            }
          }
        },
      );
      let A = vn([]);
      async function j() {
        A.value = await t_2().getExchangeSupportedSymbols(s.value.exchange);
        for (let e of [...s.value.routes, ...s.value.data_routes]) {
          if (!A.value.includes(e.symbol)) {
            e.symbol = A.value[0];
          }
        }
      }
      s.value.exchange = s.value.exchange || t_2().backtestingExchangeNames[0];
      Ht(
        () => s.value.exchange,
        (e, t) => {
          if (e !== t) {
            o.ensureFormConfig();
          }
        },
      );
      function M(e) {
        let t = e.slice(-1);
        let n = parseInt(e.slice(0, -1));
        switch (t) {
          case `m`:
            return n;
          case `h`:
            return n * 60;
          case `D`:
            return n * 24 * 60;
          default:
            return 0;
        }
      }
      async function N() {
        if (m.value.length) {
          for (let e = 0; e < m.value.length; e++) {
            O_1(`error`, m.value[e]);
          }
          return;
        }
        if (!s.value.run_trades && !s.value.run_candles) {
          O_1(
            `error`,
            `Please select at least one simulation type (Trades or Candles).`,
          );
          return;
        }
        let batch_size = s.value.pipeline_params.batch_size;
        let t = 1440;
        if (batch_size < t) {
          O_1(
            `error`,
            `Batch size must be at least ${t} minutes (1 day). Current: ${batch_size} minutes.`,
          );
          return;
        }
        let n = [...s.value.routes, ...s.value.data_routes].map(
          (e) => e.timeframe,
        );
        let r = Infinity;
        for (let e of n) {
          let t = M(e);
          if (t > 0 && t < r) {
            r = t;
          }
        }
        if (r === Infinity) {
          r = 1;
        }
        if (batch_size % r !== 0) {
          O_1(
            `error`,
            `Batch size (${batch_size} minutes) must be a multiple of the minimum timeframe (${r} minutes).`,
          );
          return;
        }
        f.value = true;
        let i = await n_1().start();
        if (i && i.status && i.status === `success`) {
          P(`/monte-carlo/${i.id}?status=running`);
        }
        f.value = false;
      }
      function P(e) {
        a.push(e);
      }
      return (n, r) => {
        let a = t_13;
        let o = t_4;
        let d = t_10;
        let h = t_7;
        let T = i_2;
        let E = t_6;
        let D = x_2;
        let M = t_5;
        let ee = $e;
        let F = r_3;
        let I = t_11;
        let L = t_12;
        mt_1();
        return b(`div`, rt, [
          __1(`div`, it, [
            D_1(
              L,
              {
                compact: ``,
              },
              {
                left: qt(() => [
                  p.value
                    ? (mt_1(),
                      v(a, {
                        key: 0,
                      }))
                    : y_1(``, true),
                  p.value
                    ? y_1(``, true)
                    : (mt_1(),
                      b(`div`, at, [
                        D_1(
                          h,
                          {
                            title: `Setup`,
                            flush: ``,
                            help: `Pick the exchange and the date range to simulate on. Period presets always end at yesterday, so every day has complete candles.`,
                          },
                          {
                            default: qt(() => [
                              __1(`div`, ot, [
                                __1(`div`, st, [
                                  (r[15] ||= __1(
                                    `span`,
                                    {
                                      class: `shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400`,
                                    },
                                    `Exchange`,
                                    -1,
                                  )),
                                  D_1(
                                    o,
                                    {
                                      modelValue: s.value.exchange,
                                      "onUpdate:modelValue": [
                                        (r[0] ||= (e) =>
                                          (s.value.exchange = e)),
                                        j,
                                      ],
                                      placeholder: `Select an exchange...`,
                                      class: `w-80`,
                                      items: On(t_2)().backtestingExchangeNames,
                                    },
                                    null,
                                    8,
                                    [`modelValue`, `items`],
                                  ),
                                ]),
                                __1(`div`, ct, [
                                  D_1(
                                    d,
                                    {
                                      start: s.value.start_date,
                                      "onUpdate:start": (r[1] ||= (e) =>
                                        (s.value.start_date = e)),
                                      finish: s.value.finish_date,
                                      "onUpdate:finish": (r[2] ||= (e) =>
                                        (s.value.finish_date = e)),
                                    },
                                    null,
                                    8,
                                    [`start`, `finish`],
                                  ),
                                ]),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          T,
                          {
                            "total-routes-error": m.value,
                            form: s.value,
                            mode: `monte-carlo`,
                            symbols: A.value,
                            timeframes: C.value,
                          },
                          null,
                          8,
                          [
                            `total-routes-error`,
                            `form`,
                            `symbols`,
                            `timeframes`,
                          ],
                        ),
                        D_1(
                          h,
                          {
                            title: `Simulation Types`,
                            help: `Trades simulation reshuffles the original backtest's trades; candles simulation re-runs the strategy on regenerated price data.`,
                          },
                          {
                            default: qt(() => [
                              __1(`div`, lt, [
                                D_1(
                                  E,
                                  {
                                    modelValue: s.value.run_trades,
                                    "onUpdate:modelValue": (r[3] ||= (e) =>
                                      (s.value.run_trades = e)),
                                    compact: ``,
                                    title: `Trades Simulation`,
                                    description: `Reshuffle the executed trades of the original run.`,
                                  },
                                  null,
                                  8,
                                  [`modelValue`],
                                ),
                                D_1(
                                  E,
                                  {
                                    modelValue: s.value.run_candles,
                                    "onUpdate:modelValue": (r[4] ||= (e) =>
                                      (s.value.run_candles = e)),
                                    compact: ``,
                                    title: `Candles Simulation`,
                                    description: `Re-run the strategy on regenerated candles.`,
                                  },
                                  null,
                                  8,
                                  [`modelValue`],
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          h,
                          {
                            title: `Scenarios`,
                          },
                          {
                            default: qt(() => [
                              D_1(
                                D,
                                {
                                  modelValue: s.value.num_scenarios,
                                  "onUpdate:modelValue": (r[5] ||= (e) =>
                                    (s.value.num_scenarios = e)),
                                  title: `Number of scenarios:`,
                                },
                                null,
                                8,
                                [`modelValue`],
                              ),
                            ]),
                            _: 1,
                          },
                        ),
                        s.value.run_candles
                          ? (mt_1(),
                            v(
                              h,
                              {
                                key: 0,
                                title: `Pipeline Configuration`,
                              },
                              {
                                default: qt(() => [
                                  __1(`div`, ut, [
                                    __1(`div`, null, [
                                      (r[16] ||= __1(
                                        `label`,
                                        {
                                          class: `text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block`,
                                        },
                                        `Pipeline Type`,
                                        -1,
                                      )),
                                      D_1(
                                        o,
                                        {
                                          modelValue: s.value.pipeline_type,
                                          "onUpdate:modelValue": (r[6] ||= (
                                            e,
                                          ) => (s.value.pipeline_type = e)),
                                          "value-key": `value`,
                                          "search-input": false,
                                          items: [
                                            {
                                              label: `Moving Block Bootstrap`,
                                              value: `moving_block_bootstrap`,
                                            },
                                            {
                                              label: `Gaussian Noise`,
                                              value: `gaussian`,
                                            },
                                          ],
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    __1(`div`, null, [
                                      __1(`div`, dt, [
                                        (r[18] ||= __1(
                                          `label`,
                                          {
                                            class: `text-sm font-medium text-gray-700 dark:text-gray-200`,
                                          },
                                          ` Batch Size `,
                                          -1,
                                        )),
                                        D_1(
                                          ee,
                                          {
                                            mode: `hover`,
                                            content: {
                                              side: `top`,
                                            },
                                          },
                                          {
                                            content: qt(() => [
                                              ...(r[17] ||= [
                                                __1(
                                                  `div`,
                                                  {
                                                    class: `p-4 max-w-sm`,
                                                  },
                                                  [
                                                    __1(
                                                      `h3`,
                                                      {
                                                        class: `font-semibold text-sm mb-2`,
                                                      },
                                                      `What is Batch Size?`,
                                                    ),
                                                    __1(
                                                      `p`,
                                                      {
                                                        class: `text-xs text-gray-600 dark:text-gray-400 mb-2`,
                                                      },
                                                      ` The batch size controls how many 1-minute candles are processed together in each regeneration cycle. `,
                                                    ),
                                                    __1(
                                                      `p`,
                                                      {
                                                        class: `text-xs text-gray-600 dark:text-gray-400 mb-2`,
                                                      },
                                                      [
                                                        __1(
                                                          `strong`,
                                                          null,
                                                          `Larger values`,
                                                        ),
                                                        E_1(
                                                          ` (e.g., 7-14 days) preserve longer-term market patterns and trends, making simulations more realistic. `,
                                                        ),
                                                      ],
                                                    ),
                                                    __1(
                                                      `p`,
                                                      {
                                                        class: `text-xs text-gray-600 dark:text-gray-400`,
                                                      },
                                                      [
                                                        __1(
                                                          `strong`,
                                                          null,
                                                          `Smaller values`,
                                                        ),
                                                        E_1(
                                                          ` (e.g., 1-3 days) create more variation between scenarios but may lose longer-term dependencies. `,
                                                        ),
                                                      ],
                                                    ),
                                                  ],
                                                  -1,
                                                ),
                                              ]),
                                            ]),
                                            default: qt(() => [
                                              D_1(M, {
                                                icon: `i-heroicons-information-circle`,
                                                size: `xs`,
                                                color: `neutral`,
                                                variant: `ghost`,
                                                ui: {
                                                  base: `rounded-full`,
                                                },
                                              }),
                                            ]),
                                            _: 1,
                                          },
                                        ),
                                      ]),
                                      __1(`div`, ft, [
                                        __1(`div`, pt, [
                                          (mt_1(),
                                          b(
                                            o_1,
                                            null,
                                            bt_1(g, (n) =>
                                              D_1(
                                                M,
                                                {
                                                  key: n.value,
                                                  color:
                                                    _.value === n.value
                                                      ? `primary`
                                                      : `neutral`,
                                                  variant:
                                                    _.value === n.value
                                                      ? `solid`
                                                      : `soft`,
                                                  size: `sm`,
                                                  onClick: (e) => O(n.value),
                                                },
                                                {
                                                  default: qt(() => [
                                                    E_1(nr(n.label), 1),
                                                  ]),
                                                  _: 2,
                                                },
                                                1032,
                                                [`color`, `variant`, `onClick`],
                                              ),
                                            ),
                                            64,
                                          )),
                                          D_1(
                                            M,
                                            {
                                              color:
                                                _.value === `custom`
                                                  ? `primary`
                                                  : `neutral`,
                                              variant:
                                                _.value === `custom`
                                                  ? `solid`
                                                  : `soft`,
                                              size: `sm`,
                                              onClick: (r[7] ||= (e) =>
                                                O(`custom`)),
                                            },
                                            {
                                              default: qt(() => [
                                                ...(r[19] ||= [
                                                  E_1(` Custom `, -1),
                                                ]),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            [`color`, `variant`],
                                          ),
                                        ]),
                                        __1(`div`, null, [
                                          __1(
                                            `p`,
                                            mt,
                                            nr(
                                              s.value.pipeline_params
                                                .batch_size,
                                            ) +
                                              ` minutes (` +
                                              nr(
                                                Number(
                                                  (
                                                    s.value.pipeline_params
                                                      .batch_size / 1440
                                                  ).toFixed(1),
                                                ),
                                              ) +
                                              ` days) `,
                                            1,
                                          ),
                                        ]),
                                      ]),
                                      _.value === `custom`
                                        ? (mt_1(),
                                          b(`div`, ht, [
                                            D_1(
                                              D,
                                              {
                                                modelValue:
                                                  s.value.pipeline_params
                                                    .batch_size,
                                                "onUpdate:modelValue": (r[8] ||=
                                                  (e) =>
                                                    (s.value.pipeline_params.batch_size =
                                                      e)),
                                                title: `Batch Size (in minutes):`,
                                                min: 1,
                                                step: 60,
                                              },
                                              null,
                                              8,
                                              [`modelValue`],
                                            ),
                                          ]))
                                        : y_1(``, true),
                                    ]),
                                    S.value === `gaussian`
                                      ? (mt_1(),
                                        b(`div`, gt, [
                                          D_1(
                                            D,
                                            {
                                              modelValue:
                                                s.value.pipeline_params
                                                  .close_sigma,
                                              "onUpdate:modelValue": (r[9] ||= (
                                                e,
                                              ) =>
                                                (s.value.pipeline_params.close_sigma =
                                                  e)),
                                              title: `Close Sigma:`,
                                            },
                                            null,
                                            8,
                                            [`modelValue`],
                                          ),
                                          D_1(
                                            D,
                                            {
                                              modelValue:
                                                s.value.pipeline_params
                                                  .high_sigma,
                                              "onUpdate:modelValue": (r[10] ||=
                                                (e) =>
                                                  (s.value.pipeline_params.high_sigma =
                                                    e)),
                                              title: `High Sigma:`,
                                            },
                                            null,
                                            8,
                                            [`modelValue`],
                                          ),
                                          D_1(
                                            D,
                                            {
                                              modelValue:
                                                s.value.pipeline_params
                                                  .low_sigma,
                                              "onUpdate:modelValue": (r[11] ||=
                                                (e) =>
                                                  (s.value.pipeline_params.low_sigma =
                                                    e)),
                                              title: `Low Sigma:`,
                                            },
                                            null,
                                            8,
                                            [`modelValue`],
                                          ),
                                        ]))
                                      : y_1(``, true),
                                  ]),
                                ]),
                                _: 1,
                              },
                            ))
                          : y_1(``, true),
                        D_1(
                          h,
                          {
                            title: `Options`,
                          },
                          {
                            default: qt(() => [
                              __1(`div`, _t, [
                                D_1(
                                  E,
                                  {
                                    modelValue: s.value.fast_mode,
                                    "onUpdate:modelValue": (r[12] ||= (e) =>
                                      (s.value.fast_mode = e)),
                                    compact: ``,
                                    title: `Fast Mode`,
                                    description: `Runs the simulation faster using an improved algorithm.`,
                                  },
                                  null,
                                  8,
                                  [`modelValue`],
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                        s.value.config
                          ? (mt_1(),
                            v(
                              F,
                              {
                                key: 1,
                              },
                              {
                                default: qt(() => [
                                  D_1(
                                    nt,
                                    {
                                      config: s.value.config,
                                      exchange: s.value.exchange,
                                    },
                                    null,
                                    8,
                                    [`config`, `exchange`],
                                  ),
                                ]),
                                _: 1,
                              },
                            ))
                          : y_1(``, true),
                      ])),
                ]),
                right: qt(() => [
                  p.value
                    ? (mt_1(),
                      b(`div`, vt, [
                        D_1(I, {
                          class: `h-16 w-full`,
                        }),
                        D_1(I, {
                          class: `h-16 w-full`,
                        }),
                      ]))
                    : (mt_1(),
                      v(
                        h,
                        {
                          key: 1,
                          title: `Summary`,
                          flush: ``,
                          "overflow-hidden": ``,
                          selectable: ``,
                        },
                        {
                          footer: qt(() => [
                            D_1(
                              M,
                              {
                                block: ``,
                                icon: `i-heroicons-bolt`,
                                variant: `solid`,
                                size: `lg`,
                                label: `Start simulation`,
                                disabled: f.value,
                                loading: f.value,
                                trailing: false,
                                onClick: (r[13] ||= (e) => N()),
                              },
                              null,
                              8,
                              [`disabled`, `loading`],
                            ),
                            D_1(M, {
                              block: ``,
                              class: `mt-2`,
                              color: `neutral`,
                              icon: `i-heroicons-clock`,
                              variant: `ghost`,
                              size: `lg`,
                              label: `History`,
                              trailing: false,
                              onClick: (r[14] ||= (e) =>
                                P(`/monte-carlo/history`)),
                            }),
                          ]),
                          default: qt(() => [
                            __1(`dl`, yt, [
                              __1(`div`, bt, [
                                (r[20] ||= __1(
                                  `dt`,
                                  {
                                    class: `font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Exchange:`,
                                  -1,
                                )),
                                __1(`dd`, xt, nr(s.value.exchange || `-`), 1),
                              ]),
                              __1(`div`, St, [
                                (r[21] ||= __1(
                                  `dt`,
                                  {
                                    class: `font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Period:`,
                                  -1,
                                )),
                                __1(
                                  `dd`,
                                  Ct,
                                  nr(
                                    (`daysBetween` in n
                                      ? n.daysBetween
                                      : On(t_9))(
                                      s.value.start_date,
                                      s.value.finish_date,
                                    ),
                                  ) + ` days`,
                                  1,
                                ),
                              ]),
                              __1(`div`, wt, [
                                (r[22] ||= __1(
                                  `dt`,
                                  {
                                    class: `font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Scenarios:`,
                                  -1,
                                )),
                                __1(`dd`, Tt, nr(s.value.num_scenarios), 1),
                              ]),
                              __1(`div`, Et, [
                                (r[23] ||= __1(
                                  `dt`,
                                  {
                                    class: `font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Simulations:`,
                                  -1,
                                )),
                                __1(`dd`, Dt, [
                                  s.value.run_trades
                                    ? (mt_1(), b(`span`, Ot, `Trades`))
                                    : y_1(``, true),
                                  s.value.run_candles
                                    ? (mt_1(), b(`span`, kt, `Candles`))
                                    : y_1(``, true),
                                  !s.value.run_trades && !s.value.run_candles
                                    ? (mt_1(), b(`span`, At, `None selected`))
                                    : y_1(``, true),
                                ]),
                              ]),
                            ]),
                          ]),
                          _: 1,
                        },
                      )),
                ]),
                _: 1,
              },
            ),
          ]),
        ]);
      };
    },
  }),
  [[`__scopeId`, `data-v-7777ff98`]],
);
export { jt as default };
