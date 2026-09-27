import { Qn, _, b, k, mt, xt } from "./CoKk4mC0.js";
const o = {
  "aria-labelledby": `section-1-title`,
};
const s = {
  class: `rounded-lg`,
};
const c = {
  "aria-labelledby": `section-2-title`,
};
export const t = Object.assign(
  k({
    __name: `Sidebar`,
    props: {
      compact: {
        type: Boolean,
        default: false,
      },
    },
    setup(r) {
      return (l, u) => {
        mt();
        return b(
          `div`,
          {
            class: Qn([
              `grid grid-cols-1 items-start lg:grid-cols-3`,
              r.compact ? `gap-3 p-2` : `gap-4 p-6`,
            ]),
          },
          [
            _(
              `div`,
              {
                class: Qn([
                  `grid grid-cols-1 lg:col-span-2`,
                  r.compact ? `gap-3` : `gap-4 px-1`,
                ]),
              },
              [_(`section`, o, [_(`div`, s, [xt(l.$slots, `left`)])])],
              2,
            ),
            _(
              `div`,
              {
                class: Qn([`grid grid-cols-1`, r.compact ? `gap-3` : `gap-4`]),
              },
              [_(`section`, c, [xt(l.$slots, `right`)])],
              2,
            ),
          ],
          2,
        );
      };
    },
  }),
  {
    __name: `LayoutsSidebar`,
  },
);
