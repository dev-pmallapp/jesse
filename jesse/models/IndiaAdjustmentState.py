import peewee

from jesse.services.db import database


if database.is_closed():
    database.open_connection()


class IndiaAdjustmentState(peewee.Model):
    """One row per (exchange, symbol) stored India series, recording the split/bonus
    corporate-action signature its currently-stored history was last imported against
    (story #8) - see jesse/services/historical_data/india/adjustment_state.py, which
    compares this against a fresh `IndiaExchangeProvider.adjustment_signature` call to
    detect a corporate action announced (or only newly parseable) AFTER the symbol's
    history was last imported, and re-imports only the symbols whose signature has
    actually changed since.
    """

    exchange = peewee.CharField()
    symbol = peewee.CharField()
    signature = peewee.CharField()
    adjusted_as_of = peewee.BigIntegerField()  # ms epoch of the import that set `signature`

    class Meta:
        database = database.db
        table_name = 'india_adjustment_state'
        primary_key = peewee.CompositeKey('exchange', 'symbol')
