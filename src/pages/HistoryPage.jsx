import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Trash2 } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  HISTORY_OPERATIONS,
  MEASUREMENT_OPTIONS,
  toTitleCase
} from "../constants/measurements";
import {
  deleteAllMeasurements,
  deleteFilteredMeasurements,
  deleteMeasurement,
  fetchHistoryByOperation,
  fetchMeasurementById,
  fetchMeasurements,
  fetchOperationCount
} from "../lib/api";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

function formatOperand(value, unit) {
  if (value === null || value === undefined) {
    return unit ? toTitleCase(unit) : "-";
  }

  return `${value} ${toTitleCase(unit || "")}`.trim();
}

function HistoryPage() {
  const { logout, token } = useAuth();
  const [filters, setFilters] = useState({
    operation: "",
    type: ""
  });
  const [entries, setEntries] = useState([]);
  const [counts, setCounts] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const typeOptions = useMemo(
    () => MEASUREMENT_OPTIONS.map((item) => item.key),
    []
  );

  function handleSessionFailure(requestError) {
    if (requestError.status === 401) {
      logout();
    }
  }

  async function loadCounts() {
    try {
      const results = await Promise.all(
        HISTORY_OPERATIONS.map(async (operation) => [
          operation,
          await fetchOperationCount(operation, token)
        ])
      );

      setCounts(Object.fromEntries(results));
    } catch (requestError) {
      handleSessionFailure(requestError);
    }
  }

  async function loadHistory(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      let response;

      if (nextFilters.operation && !nextFilters.type) {
        response = await fetchHistoryByOperation(nextFilters.operation, token);
      } else {
        response = await fetchMeasurements(
          {
            operation: nextFilters.operation,
            type: nextFilters.type
          },
          token
        );
      }

      setEntries(response || []);
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    loadCounts();
  }, []);

  async function handleDelete(id) {
    try {
      await deleteMeasurement(id, token);
      if (detailItem?.id === id) {
        setDetailItem(null);
      }
      await loadHistory(filters);
      await loadCounts();
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    }
  }

  async function handleDeleteAll() {
    try {
      await deleteAllMeasurements(token);
      setDetailItem(null);
      setFilters({
        operation: "",
        type: ""
      });
      await loadHistory({
        operation: "",
        type: ""
      });
      await loadCounts();
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    }
  }

  async function handleDeleteFiltered() {
    try {
      await deleteFilteredMeasurements(filters, token);
      setDetailItem(null);
      await loadHistory(filters);
      await loadCounts();
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    }
  }

  async function handleLoadDetails(id) {
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetchMeasurementById(id, token);
      setDetailItem(response);
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <AppShell
      activePage="history"
      subtitle="Saved backend operations for every signed-in user."
      title="Measurement History"
    >
      <section className="history-layout">
        <div className="history-main">
          <div className="history-header">
            <div>
              <h2>Backend Operation History</h2>
              <p>
                Filter by operation and type to audit conversions, comparisons, and
                calculations.
              </p>
            </div>

            <button className="ghost-button" onClick={() => loadHistory(filters)} type="button">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          <div className="filter-grid">
            <label>
              <span>Filter By Operation</span>
              <select
                onChange={(event) =>
                  setFilters((current) => ({ ...current, operation: event.target.value }))
                }
                value={filters.operation}
              >
                <option value="">All operations</option>
                {HISTORY_OPERATIONS.map((operation) => (
                  <option key={operation} value={operation}>
                    {toTitleCase(operation)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Filter By Measurement Type</span>
              <select
                onChange={(event) =>
                  setFilters((current) => ({ ...current, type: event.target.value }))
                }
                value={filters.type}
              >
                <option value="">All types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {toTitleCase(type)}
                  </option>
                ))}
              </select>
            </label>

            <button className="primary-button compact" onClick={() => loadHistory(filters)} type="button">
              Apply Filters
            </button>
          </div>

          <div className="history-actions">
            <button className="danger-outline" onClick={handleDeleteAll} type="button">
              <Trash2 size={16} />
              Delete All
            </button>

            {(filters.operation || filters.type) && (
              <button className="ghost-button" onClick={handleDeleteFiltered} type="button">
                <Trash2 size={16} />
                Delete Filtered
              </button>
            )}
          </div>

          {error ? <p className="status-message error">{error}</p> : null}

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Operand 1</th>
                  <th>Operand 2</th>
                  <th>Result</th>
                  <th>Measurement Type</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">Loading history...</td>
                  </tr>
                ) : entries.length ? (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{toTitleCase(entry.operation)}</td>
                      <td>{formatOperand(entry.thisValue, entry.thisUnit)}</td>
                      <td>{formatOperand(entry.thatValue, entry.thatUnit)}</td>
                      <td>{`${entry.resultValue} ${toTitleCase(entry.resultUnit || "")}`.trim()}</td>
                      <td>{toTitleCase(entry.thisMeasurementType)}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            onClick={() => handleLoadDetails(entry.id)}
                            type="button"
                          >
                            <Eye size={15} />
                            View
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(entry.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No history found for the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="history-sidepanel">
          <div className="sidepanel-card">
            <p className="result-card-caption">Operation Counts</p>
            <div className="count-grid">
              {HISTORY_OPERATIONS.map((operation) => (
                <div className="count-card" key={operation}>
                  <span>{toTitleCase(operation)}</span>
                  <strong>{counts[operation] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="sidepanel-card">
            <p className="result-card-caption">Selected Entry</p>
            {detailLoading ? (
              <p className="placeholder-copy">Loading entry details...</p>
            ) : detailItem ? (
              <div className="detail-stack">
                <div>
                  <span>Operation</span>
                  <strong>{toTitleCase(detailItem.operation)}</strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{formatOperand(detailItem.thisValue, detailItem.thisUnit)}</strong>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{formatOperand(detailItem.thatValue, detailItem.thatUnit)}</strong>
                </div>
                <div>
                  <span>Result</span>
                  <strong>{`${detailItem.resultValue} ${toTitleCase(detailItem.resultUnit || "")}`}</strong>
                </div>
                <div>
                  <span>Measurement Type</span>
                  <strong>{toTitleCase(detailItem.thisMeasurementType)}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatDate(detailItem.createdAt)}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(detailItem.updatedAt)}</strong>
                </div>
              </div>
            ) : (
              <p className="placeholder-copy">
                Pick any row to load the backend detail endpoint for that measurement entry.
              </p>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

export default HistoryPage;
