import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";

import "react-day-picker/dist/style.css";
import "./App.css";

const LAMBDA_URL =
  "https://vclugsqwoot7iizxkcrp6247k40pumqg.lambda-url.eu-north-1.on.aws/";

const CINEMAS = [
  "Barbican",
  "BFI Southbank",
  "Castle",
  "Nickel",
  "Close-Up",
  "Ciné Lumière",
  "The Cinema Museum",
  "Garden Cinema",
  "Rio",
  "ICA",
];

const DATE_PRESETS = [
  "today",
  "tomorrow",
  "this week",
  "over next 2 weeks",
  "in next 5 days",
];

function formatRange(range: DateRange): string | null {
  if (!range.from || !range.to) return null;

  const from = range.from.toISOString().slice(0, 10);
  const to = range.to.toISOString().slice(0, 10);

  return from === to ? from : `${from} to ${to}`;
}

function buildAssistedQuery(
  cinemas: string[],
  datePresets: string[],
  dateRanges: DateRange[],
  film: string
): string {
  const parts: string[] = [];

  if (film.trim()) parts.push(film.trim());

  if (cinemas.length > 0) {
    parts.push(`at ${cinemas.join(" or ")}`);
  }

  const dateParts: string[] = [];

  if (datePresets.length > 0) dateParts.push(...datePresets);

  const formattedRanges = dateRanges
    .map(formatRange)
    .filter((r): r is string => Boolean(r));

  if (formattedRanges.length > 0) dateParts.push(...formattedRanges);

  if (dateParts.length > 0) parts.push(dateParts.join(" or "));

  return parts.join(", ");
}

export default function App() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cinemas, setCinemas] = useState<string[]>([]);
  const [datePresets, setDatePresets] = useState<string[]>([]);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [currentRange, setCurrentRange] = useState<DateRange | undefined>();
  const [film, setFilm] = useState("");

  const today = new Date();
  const endOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    0
  );

  useEffect(() => {
    const assisted = buildAssistedQuery(
      cinemas,
      datePresets,
      dateRanges,
      film
    );
    if (assisted) setQuery(assisted);
  }, [cinemas, datePresets, dateRanges, film]);

  const sendQuery = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: query,
          raw_listings_path: "raw_listings_v1.json",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResponse(await res.text());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleValue = (
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  const addDateRange = () => {
    if (!currentRange?.from || !currentRange?.to) return;
    setDateRanges([...dateRanges, currentRange]);
    setCurrentRange(undefined);
  };

  const removeDateRange = (idx: number) => {
    setDateRanges(dateRanges.filter((_, i) => i !== idx));
  };

  return (
    <div className="container">
      <h1>Kinologue AI 🤖🧠</h1>

      <p className="intro">
        Ask Kinologue AI questions about what's showing at London's best
        independent cinemas.
        <br />
        Data sourced from{" "}
        <a href="https://www.kinologue.co.uk" target="_blank">
          kinologue.co.uk
        </a>
        .
      </p>

      <strong>Example prompts:</strong>
      <div className="examples">
        <span>Is Sentimental Value showing at the ICA or Barbican on 18th Jan?</span>
        <span>what is on at BFI, ICA, Close-Up 17th and 18th Jan</span>
        <span>when is Sentimental Value at ICA or Barbican?</span>
        <span>What is on at BFI and ICA?</span>
      </div>

      <h3 className="assisted-grid" style={{paddingLeft: "5px", marginTop: "5px", marginBottom: "5px"}}>Assisted query builder</h3>

      <div className="assisted-grid">
        <div className="section">
          <strong>Cinemas</strong>
          <div className="chips">
            {CINEMAS.map((c) => (
              <button
                key={c}
                className={cinemas.includes(c) ? "chip active" : "chip"}
                onClick={() => toggleValue(c, cinemas, setCinemas)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="section" style={{borderRight: "1px solid #cacacaff", borderLeft: "1px solid #cacacaff"}}>
          <strong>Dates</strong>
          <div className="chips">
            {DATE_PRESETS.map((d) => (
              <button
                key={d}
                className={datePresets.includes(d) ? "chip active" : "chip"}
                onClick={() =>
                  toggleValue(d, datePresets, setDatePresets)
                }
              >
                {d}
              </button>
            ))}
          </div>

          <DayPicker
            mode="range"
            selected={currentRange}
            onSelect={setCurrentRange}
            fromDate={today}
            toDate={endOfNextMonth}
          />

          <button onClick={addDateRange} disabled={!currentRange?.to}>
            Add range
          </button>

          {dateRanges.map((r, i) => (
            <div key={i}>
              {formatRange(r)}{" "}
              <button onClick={() => removeDateRange(i)}>×</button>
            </div>
          ))}
        </div>

        <div className="section">
          <strong>Film name</strong>
          <input
            value={film}
            onChange={(e) => setFilm(e.target.value)}
            placeholder="Optional film title"
          />
        </div>
      </div>
      
      <div className="send_section">
        <h3 style={{marginTop: "5px", marginBottom: "5px"}}>Ask Kinologue 👀</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type or build your question…"
        />

        <button onClick={sendQuery} disabled={!query || loading}>
          Send query
        </button>

        {loading && (
          <div className="loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span>Thinking…</span>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {response && <pre className="response">{response}</pre>}
      </div>
    </div>
  );
}
