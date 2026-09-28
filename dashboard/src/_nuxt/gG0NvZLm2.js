import { D, O, S, _, f, g, h, p, t as t_1, ut, v, w, y } from "./B8_r5oP7.js";
export const t = ut(`significanceTest`, {
  state: () => ({
    form: {
      id: ``,
      start_date: `2021-01-01`,
      finish_date: `2022-01-01`,
      n_simulations: 2000,
      random_seed: null,
      exchange: ``,
      routes: [
        {
          symbol: ``,
          timeframe: `4h`,
          strategy: ``,
        },
      ],
      data_routes: [],
    },
    results: {
      showResults: false,
      executing: false,
      observed_mean: null,
      annualized_return: null,
      p_value: null,
      n_simulations: null,
      n_observations: null,
      progressbar: {
        current: 0,
        total: 0,
        estimated_remaining_seconds: 0,
      },
      info: [],
      exception: {
        error: ``,
        traceback: ``,
      },
      alert: {
        message: ``,
        type: ``,
      },
    },
    status: ``,
  }),
  actions: {
    ensureFormConfig(e = false) {
      let t = t_1();
      let n = h(t.settings, t.exchangeInfo);
      t.settings.session_defaults = n;
      let r = v(n.significance_test, this.form.exchange);
      this.form.config = !this.form.config || e ? r : g(this.form.config, r);
      y(
        this.form.config.exchange,
        this.form.exchange,
        t.exchangeInfo[this.form.exchange],
      );
    },
    async init() {
      if (!this.form.id) {
        this.form.id = w.uuid();
      }
    },
    async getRunningSession() {
      let { data, error } = await S(`/significance-test/running-session`, {
        authenticated: true,
      });
      if (error.value) {
        return null;
      }
      if (data.value && data.value.session_id) {
        return data.value.session_id;
      }
      return null;
    },
    async saveState() {
      if (this.form.id) {
        try {
          let { error: t } = await S(`/significance-test/update-state`, {
            method: `POST`,
            body: {
              id: this.form.id,
              state: {
                form: this.form,
                results: {
                  alert: this.results.alert,
                },
              },
            },
            authenticated: true,
          });
          if (t.value) {
            D(t.value);
          }
        } catch (t) {
          D(t);
        }
      }
    },
    async start() {
      let i = t_1();
      this.ensureFormConfig();
      let { data, error } = await S(`/significance-test`, {
        method: `POST`,
        body: this._resetResults(),
        authenticated: true,
      });
      if (error.value) {
        this.results.executing = false;
        if (error.value.statusCode === 500) {
          O(`error`, error.value.data?.message || `Server error`);
        } else {
          D(error.value);
        }
        return {
          status: `fail`,
        };
      }
      let s = data.value?.session_id;
      if (s) {
        this.form.id = s;
        this.status = `running`;
      }
      _(
        i.settings.session_defaults.significance_test,
        this.form.exchange,
        this.form.config,
      );
      i.updateConfig();
      return {
        status: `success`,
        id: s,
      };
    },
    async cancel() {
      this.results.executing = false;
      await S(`/significance-test/cancel`, {
        method: `POST`,
        body: {
          id: this.form.id,
        },
        authenticated: true,
      });
    },
    async terminate(id) {
      this.results.executing = false;
      await S(`/significance-test/terminate`, {
        method: `POST`,
        body: {
          id,
        },
        authenticated: true,
      });
    },
    async loadSession(t) {
      try {
        let { data: r, error: i } = await S(
          `/significance-test/sessions/${t}`,
          {
            method: `POST`,
            authenticated: true,
          },
        );
        if (i.value) {
          D(i.value);
          return false;
        }
        let a = r.value;
        return this.hydrateSession(a?.session);
      } catch (t) {
        D(t);
        return false;
      }
    },
    hydrateSession(e) {
      if (!e || !e.state) {
        return (O(`error`, `Session state not found`), false);
      }
      return (
        this._resetResults(),
        (this.status = e.status),
        e.state.form &&
          ((this.form = {
            ...e.state.form,
            id: e.id,
          }),
          this.ensureFormConfig()),
        e.results &&
          ((this.results.observed_mean = e.results.observed_mean),
          (this.results.annualized_return = e.results.annualized_return),
          (this.results.p_value = e.results.p_value),
          (this.results.n_simulations = e.results.n_simulations),
          (this.results.n_observations = e.results.n_observations),
          (this.results.showResults = true)),
        e.state.results?.alert && (this.results.alert = e.state.results.alert),
        e.exception &&
          ((this.results.exception.error = e.exception),
          (this.results.exception.traceback = e.traceback ?? ``)),
        (this.results.executing = e.status === `running`),
        true
      );
    },
    async getSessionData(t) {
      try {
        let { data: r, error: i } = await S(
          `/significance-test/sessions/${t}`,
          {
            method: `POST`,
            authenticated: true,
          },
        );
        if (i.value) {
          return (i.value?.statusCode === 404 || D(i.value), null);
        }
        return r.value?.session || null;
      } catch (t) {
        D(t);
        return null;
      }
    },
    async updateSessionNotes(t, title, description) {
      try {
        let { data: a, error: o } = await S(
          `/significance-test/sessions/${t}/notes`,
          {
            method: `POST`,
            body: {
              id: t,
              title,
              description,
            },
            authenticated: true,
          },
        );
        if (o.value) {
          return (D(o.value), false);
        }
        return true;
      } catch (t) {
        D(t);
        return false;
      }
    },
    async getStrategyCode(t) {
      try {
        let { data: e, error: r } = await S(
          `/significance-test/sessions/${t}/strategy-code`,
          {
            method: `POST`,
            authenticated: true,
          },
        );
        return e.value.strategy_code;
      } catch (t) {
        D(t);
        return null;
      }
    },
    clearCurrentSession() {
      this._resetResults();
      this.results.executing = false;
    },
    prepareNewSession() {
      this.form.id = w.uuid();
      this.status = `draft`;
      this.clearCurrentSession();
    },
    generalInfoEvent(e, t) {
      if (!this.results.executing) {
        this.results.executing = true;
      }
    },
    progressbarEvent(e, t) {
      this.results.progressbar.current = t.current;
      this.results.progressbar.total = t.total;
      this.results.progressbar.estimated_remaining_seconds =
        t.estimated_remaining_seconds || 0;
    },
    resultsEvent(e, t) {
      this.results.observed_mean = t.observed_mean;
      this.results.annualized_return = t.annualized_return;
      this.results.p_value = t.p_value;
      this.results.n_simulations = t.n_simulations;
      this.results.n_observations = t.n_observations;
    },
    exceptionEvent(e, t) {
      this.results.exception.error = t.error;
      this.results.exception.traceback = t.traceback;
      this.results.executing = false;
      this.status = `stopped`;
    },
    terminationEvent(e) {
      if (this.results.executing) {
        this.results.executing = false;
      }
    },
    alertEvent(e, t) {
      this.results.executing = false;
      this.results.showResults = true;
      this.results.alert = t;
    },
    _resetResults() {
      this.ensureFormConfig();
      this.results.executing = true;
      this.results.showResults = false;
      this.results.observed_mean = null;
      this.results.annualized_return = null;
      this.results.p_value = null;
      this.results.n_simulations = null;
      this.results.n_observations = null;
      this.results.progressbar.current = 0;
      this.results.progressbar.total = 0;
      this.results.progressbar.estimated_remaining_seconds = 0;
      this.results.exception.error = ``;
      this.results.exception.traceback = ``;
      this.results.alert = {
        message: ``,
        type: ``,
      };
      t_1();
      let e = f();
      return {
        id: this.form.id,
        exchange: this.form.exchange,
        routes: this.form.routes,
        data_routes: this.form.data_routes,
        config: p(this.form.config),
        start_date: this.form.start_date,
        finish_date: this.form.finish_date,
        n_simulations: Number(this.form.n_simulations),
        random_seed: this.form.random_seed
          ? Number(this.form.random_seed)
          : null,
        theme: e.value === `dark` ? `dark` : `light`,
        state: this.$state,
      };
    },
  },
});
