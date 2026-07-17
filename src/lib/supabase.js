// Drop-in replacement for the Supabase JS client, backed by a self-hosted
// Postgres database via the /api/query route. It reproduces the small subset
// of the Supabase query-builder surface this app actually uses:
//   .from().select()/.insert()/.update()/.delete()
//   .eq() .in() .order() .single() .abortSignal()
// The builder is thenable, so `await supabase.from(...)...` works unchanged.

const ENDPOINT = '/api/query';

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._op = 'select';
    this._columns = '*';
    this._values = undefined;
    this._filters = [];
    this._order = undefined;
    this._single = false;
    this._signal = undefined;
  }

  select(columns = '*') {
    // After a write, .select() just asks for the affected rows (already
    // returned via RETURNING *), so it is a no-op there.
    if (this._op === 'select') {
      this._columns = columns || '*';
    }
    return this;
  }

  insert(values) {
    this._op = 'insert';
    this._values = values;
    return this;
  }

  update(values) {
    this._op = 'update';
    this._values = values;
    return this;
  }

  delete() {
    this._op = 'delete';
    return this;
  }

  eq(col, val) {
    this._filters.push({ col, op: 'eq', val });
    return this;
  }

  in(col, val) {
    this._filters.push({ col, op: 'in', val });
    return this;
  }

  order(col, opts = {}) {
    this._order = { col, ascending: opts.ascending !== false };
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  abortSignal(signal) {
    this._signal = signal;
    return this;
  }

  _descriptor() {
    return {
      table: this._table,
      op: this._op,
      columns: this._columns,
      values: this._values,
      filters: this._filters,
      order: this._order,
      single: this._single,
    };
  }

  async _execute() {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._descriptor()),
        signal: this._signal,
      });
      const body = await res.json();
      return body; // { data, error }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return { data: null, error: { message: 'aborted', code: 'ABORTED' } };
      }
      return { data: null, error: { message: err.message, code: 'FETCH_ERROR' } };
    }
  }

  // Thenable: awaiting the builder runs the query.
  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this._execute().catch(onRejected);
  }

  finally(onFinally) {
    return this._execute().finally(onFinally);
  }
}

export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  },
};
