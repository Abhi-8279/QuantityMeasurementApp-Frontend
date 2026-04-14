import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, CircleOff, Sigma } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  CALCULATOR_OPERATIONS,
  MEASUREMENT_OPTIONS,
  MODE_OPTIONS,
  UNITS_BY_TYPE,
  toTitleCase
} from "../constants/measurements";
import { runMeasurementOperation } from "../lib/api";

function WorkspacePage() {
  const { logout, token } = useAuth();
  const [measurementType, setMeasurementType] = useState("LENGTH");
  const [mode, setMode] = useState("CONVERT");
  const [calculatorOperation, setCalculatorOperation] = useState("ADD");
  const [values, setValues] = useState({
    fromValue: "1",
    toValue: "",
    fromUnit: "MILLIMETER",
    toUnit: "CENTIMETER"
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const units = useMemo(() => UNITS_BY_TYPE[measurementType], [measurementType]);

  useEffect(() => {
    const nextUnits = UNITS_BY_TYPE[measurementType];
    setValues((current) => ({
      ...current,
      fromUnit: nextUnits[0],
      toUnit: nextUnits[1] || nextUnits[0],
      toValue: mode === "CALCULATOR" || mode === "COMPARE" ? current.toValue || "1" : ""
    }));
    setResult(null);
    setError("");
  }, [measurementType, mode]);

  function getOperationKey() {
    if (mode === "COMPARE") {
      return "COMPARE";
    }

    if (mode === "CONVERT") {
      return "CONVERT";
    }

    return calculatorOperation;
  }

  function handleSessionFailure(requestError) {
    if (requestError.status === 401) {
      logout();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const operation = getOperationKey();
    const fromInput = values.fromValue.trim();
    const toInput = values.toValue.trim();
    const fromValue = Number(fromInput);
    const toValue = Number(toInput);

    if (!fromInput || Number.isNaN(fromValue)) {
      setError("Enter a valid source value.");
      setIsSubmitting(false);
      return;
    }

    if (mode !== "CONVERT" && (!toInput || Number.isNaN(toValue))) {
      setError("Enter a valid second value.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      thisQuantityDTO: {
        value: fromValue,
        unit: values.fromUnit,
        measurementType
      },
      thatQuantityDTO: {
        value: mode === "CONVERT" ? null : toValue,
        unit: values.toUnit,
        measurementType
      }
    };

    try {
      const response = await runMeasurementOperation(operation, payload, token);
      setResult(response);
    } catch (requestError) {
      handleSessionFailure(requestError);
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonLabel =
    mode === "COMPARE"
      ? "Run Comparison"
      : mode === "CONVERT"
        ? "Run Conversion"
        : `Run ${toTitleCase(calculatorOperation)}`;

  const resultLabel =
    result?.operation === "COMPARE"
      ? result.resultUnit === "TRUE"
        ? "Equivalent"
        : "Not Equivalent"
      : result
        ? `${result.resultValue} ${toTitleCase(result.resultUnit)}`
        : "Awaiting calculation";

  return (
    <AppShell
      activePage="workspace"
      subtitle="Choose units, switch workflows, and save every backend operation automatically."
      title="Quantity Measurement"
    >
      <section className="workspace">
        <h2>Measurement Workspace</h2>

        <div className="section-label">1. Choose measurement type</div>
        <div className="measurement-grid">
          {MEASUREMENT_OPTIONS.map((option) => (
            <button
              className={measurementType === option.key ? "measurement-card active" : "measurement-card"}
              key={option.key}
              onClick={() => setMeasurementType(option.key)}
              type="button"
            >
              <span className="measurement-emoji">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="section-label">2. Choose action</div>
        <div className="segmented-control">
          {MODE_OPTIONS.map((option) => (
            <button
              className={mode === option.key ? "segment active" : "segment"}
              key={option.key}
              onClick={() => setMode(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === "CALCULATOR" ? (
          <div className="calculator-ops">
            {CALCULATOR_OPERATIONS.map((operation) => (
              <button
                className={calculatorOperation === operation.key ? "mini-segment active" : "mini-segment"}
                key={operation.key}
                onClick={() => setCalculatorOperation(operation.key)}
                type="button"
              >
                {operation.label}
              </button>
            ))}
          </div>
        ) : null}

        <form className="workspace-form" onSubmit={handleSubmit}>
          <div className="section-label">3. Enter values</div>

          <div className="value-grid">
            <div className="value-card">
              <label className="value-card-label" htmlFor="fromValue">
                From
              </label>
              <input
                id="fromValue"
                onChange={(event) =>
                  setValues((current) => ({ ...current, fromValue: event.target.value }))
                }
                type="number"
                value={values.fromValue}
              />
              <select
                onChange={(event) =>
                  setValues((current) => ({ ...current, fromUnit: event.target.value }))
                }
                value={values.fromUnit}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {toTitleCase(unit)}
                  </option>
                ))}
              </select>
            </div>

            <div className="value-card">
              <label className="value-card-label" htmlFor="toValue">
                To
              </label>
              {mode === "CONVERT" ? (
                <div className="result-preview">
                  {result ? (
                    <>
                      <strong>{result.resultValue}</strong>
                      <span>{toTitleCase(result.resultUnit)}</span>
                    </>
                  ) : (
                    <span className="placeholder-copy">Converted value appears here</span>
                  )}
                </div>
              ) : (
                <input
                  id="toValue"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, toValue: event.target.value }))
                  }
                  type="number"
                  value={values.toValue}
                />
              )}
              <select
                onChange={(event) =>
                  setValues((current) => ({ ...current, toUnit: event.target.value }))
                }
                value={values.toUnit}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {toTitleCase(unit)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="primary-button full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Processing..." : buttonLabel}
          </button>
        </form>

        {error ? <p className="status-message error">{error}</p> : null}

        <section className="result-card">
          <div className="result-card-header">
            <div>
              <p className="result-card-caption">Latest backend result</p>
              <h3>{resultLabel}</h3>
            </div>

            <div className="result-icon">
              {mode === "COMPARE" ? (
                result?.resultUnit === "TRUE" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <CircleOff size={22} />
                )
              ) : mode === "CONVERT" ? (
                <ArrowRightLeft size={22} />
              ) : (
                <Sigma size={22} />
              )}
            </div>
          </div>

          {result ? (
            <div className="result-meta">
              <div>
                <span>Operation</span>
                <strong>{toTitleCase(result.operation)}</strong>
              </div>
              <div>
                <span>Measurement Type</span>
                <strong>{toTitleCase(result.thisMeasurementType)}</strong>
              </div>
              <div>
                <span>Saved In History</span>
                <strong>Yes</strong>
              </div>
            </div>
          ) : (
            <p className="placeholder-copy">
              Run any operation and the backend response will appear here immediately.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}

export default WorkspacePage;
