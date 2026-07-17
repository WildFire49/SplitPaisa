import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Whitelisted tables — anything else is rejected outright.
const TABLES = new Set([
  'users',
  'trips',
  'trip_members',
  'expenses',
  'expense_participants',
]);

const IDENT = /^[a-z_][a-z0-9_]*$/;

function ident(name) {
  if (name === '*') return '*';
  if (!IDENT.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

function columnList(columns) {
  if (!columns || columns === '*' || columns.trim() === '') return '*';
  return columns
    .split(',')
    .map((c) => ident(c.trim()))
    .join(', ');
}

// Build a WHERE clause from [{ col, op, val }]. `params` is mutated with the
// bound values; returns the SQL fragment (empty string if no filters).
function whereClause(filters, params) {
  if (!filters || filters.length === 0) return '';
  const parts = filters.map(({ col, op, val }) => {
    const c = ident(col);
    if (op === 'in') {
      params.push(val);
      return `${c} = ANY($${params.length})`;
    }
    // default: equality
    params.push(val);
    return `${c} = $${params.length}`;
  });
  return ` WHERE ${parts.join(' AND ')}`;
}

function orderClause(order) {
  if (!order || !order.col) return '';
  const dir = order.ascending === false ? 'DESC' : 'ASC';
  return ` ORDER BY ${ident(order.col)} ${dir}`;
}

async function run(descriptor) {
  const { table, op, columns, values, filters, order } = descriptor;

  if (!TABLES.has(table)) {
    throw new Error(`Unknown table: ${table}`);
  }

  const params = [];
  let sql;

  if (op === 'select') {
    sql =
      `SELECT ${columnList(columns)} FROM ${ident(table)}` +
      whereClause(filters, params) +
      orderClause(order);
  } else if (op === 'insert') {
    const rows = Array.isArray(values) ? values : [values];
    if (rows.length === 0) throw new Error('insert requires at least one row');
    const cols = Object.keys(rows[0]);
    if (cols.length === 0) throw new Error('insert row has no columns');
    const colSql = cols.map(ident).join(', ');
    const tuples = rows.map((row) => {
      const placeholders = cols.map((c) => {
        params.push(row[c]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    sql = `INSERT INTO ${ident(table)} (${colSql}) VALUES ${tuples.join(
      ', '
    )} RETURNING *`;
  } else if (op === 'update') {
    const obj = Array.isArray(values) ? values[0] : values;
    const cols = Object.keys(obj);
    if (cols.length === 0) throw new Error('update has no columns');
    const setSql = cols
      .map((c) => {
        params.push(obj[c]);
        return `${ident(c)} = $${params.length}`;
      })
      .join(', ');
    sql =
      `UPDATE ${ident(table)} SET ${setSql}` +
      whereClause(filters, params) +
      ' RETURNING *';
  } else if (op === 'delete') {
    sql =
      `DELETE FROM ${ident(table)}` + whereClause(filters, params) + ' RETURNING *';
  } else {
    throw new Error(`Unsupported op: ${op}`);
  }

  const result = await pool.query(sql, params);
  return result.rows;
}

export async function POST(request) {
  let descriptor;
  try {
    descriptor = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid JSON body', code: 'BAD_REQUEST' } },
      { status: 200 }
    );
  }

  try {
    const rows = await run(descriptor);

    if (descriptor.single) {
      if (rows.length === 0) {
        // Mirror Supabase/PostgREST "no rows" contract — the store branches on this.
        return NextResponse.json({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: 'The result contains 0 rows',
          },
        });
      }
      return NextResponse.json({ data: rows[0], error: null });
    }

    return NextResponse.json({ data: rows, error: null });
  } catch (err) {
    return NextResponse.json({
      data: null,
      error: { message: err.message, code: err.code || 'DB_ERROR' },
    });
  }
}
