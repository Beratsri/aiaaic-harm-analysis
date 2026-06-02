/* ============================================================
   App shell + simple client-side routing
   ============================================================ */
function App() {
  const [page, setPage] = React.useState(() => localStorage.getItem("aiaaic_page") || "home");
  React.useEffect(() => { localStorage.setItem("aiaaic_page", page); }, [page]);
  const nav = (p) => { setPage(p); document.querySelector(".main").scrollTop = 0; window.scrollTo(0, 0); };

  const Pages = {
    home: window.HomePage, overview: window.OverviewPage, companies: window.CompaniesPage,
    browser: window.BrowserPage, harmed: window.HarmedPage, ml: window.MLPage, compare: window.ComparePage
  };
  const Current = Pages[page] || window.HomePage;

  return (
    <div className="app">
      <Sidebar page={page} onNav={nav} />
      <main className="main"><Current key={page} /></main>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
