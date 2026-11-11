export default function ResponseSpark({ state }: { state: string }) {
  return <span key={state} className={`turn-spark spark-${state}`} aria-hidden="true"><span /><span /><span /><span /><span /></span>;
}
