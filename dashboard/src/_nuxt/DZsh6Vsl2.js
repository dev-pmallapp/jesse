import { $, D, Ft, k, mt, qt, v } from "./CoKk4mC0.js";
import { t as t_1 } from "./pQUz-uq3.js";
import { b } from "./1uxVtXhK2.js";
export const t = Object.assign(
  k({
    __name: `SettingsSelect`,
    props: $(
      {
        title: {},
        description: {},
        options: {},
      },
      {
        modelValue: {
          default: ``,
        },
        modelModifiers: {},
      },
    ),
    emits: [`update:modelValue`],
    setup(e) {
      let r = Ft(e, `modelValue`);
      return (n, l) => {
        let u = t_1;
        let d = b;
        mt();
        return v(
          d,
          {
            title: e.title,
            description: e.description,
          },
          {
            default: qt(() => [
              D(
                u,
                {
                  modelValue: r.value,
                  "onUpdate:modelValue": (l[0] ||= (e) => (r.value = e)),
                  class: `w-full`,
                  items: e.options,
                },
                null,
                8,
                [`modelValue`, `items`],
              ),
            ]),
            _: 1,
          },
          8,
          [`title`, `description`],
        );
      };
    },
  }),
  {
    __name: `SettingsSelect`,
  },
);
