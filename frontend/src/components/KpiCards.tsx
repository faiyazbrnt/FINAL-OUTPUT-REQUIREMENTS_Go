import type { Kpis } from "../types";
import { convertUsdToPhp, formatPhpCurrency } from "../utils/currency";

type KpiCardsProps = {
  kpis: Kpis;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const KpiCards = ({ kpis }: KpiCardsProps): JSX.Element => {
  const cards = [
    {
      title: "Total Passengers",
      value: formatNumber(kpis.totalPassengers),
      helper: "All records in dataset"
    },
    {
      title: "Survival Rate",
      value: `${kpis.survivalRatePct}%`,
      helper: `${kpis.survivors} survivors`
    },
    {
      title: "Top Survival Class",
      value: kpis.topSurvivalClass,
      helper: `Avg age ${kpis.averageAge} years`
    },
    {
      title: "Average Fare",
      value: formatPhpCurrency(convertUsdToPhp(kpis.averageFare)),
      helper: "Mean fare across passengers"
    }
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Key metrics">
      {cards.map((card) => (
        <article key={card.title} className="panel p-4 md:p-5">
          <h3 className="text-sm font-medium text-slate-500">{card.title}</h3>
          <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          <p className="mt-2 text-sm text-slate-600">{card.helper}</p>
        </article>
      ))}
    </section>
  );
};

export default KpiCards;
