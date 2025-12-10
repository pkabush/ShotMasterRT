import React, { useState } from "react";

interface TabsContainerProps {
  tabs: Record<string, React.ReactNode>;
}

const TabsContainer: React.FC<TabsContainerProps> = ({ tabs }) => {
  const tabKeys = Object.keys(tabs);
  const [active, setActive] = useState(tabKeys[0]);

  return (
    <div>
      {/* Tab Headers */}
      <ul className="nav nav-tabs">
        {tabKeys.map((key) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link ${active === key ? "active" : ""}`}
              onClick={() => setActive(key)}
            >
              {key}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="tab-content p-3 border border-top-0">
        <div className="tab-pane fade show active">
          {tabs[active]}
        </div>
      </div>
    </div>
  );
};

export default TabsContainer;
