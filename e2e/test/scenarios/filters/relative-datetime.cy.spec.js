import dayjs from "dayjs";

import "metabase/lib/dayjs";

const { H } = cy;

const STARTING_FROM_UNITS = [
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "quarters",
  "years",
];

describe("scenarios > question > relative-datetime", () => {
  const now = dayjs().utc();

  beforeEach(() => {
    H.restore();
    cy.signInAsNormalUser();
  });

  describe("starting from", () => {
    const date = (values) =>
      values.reduce((val, [num, unit]) => val.add(num, unit), now.clone());

    STARTING_FROM_UNITS.forEach((unit) =>
      it(`should work with Past filters (${unit} ago)`, () => {
        nativeSQL([
          now,
          date([[-1, unit]]),
          date([[-14, unit]]),
          date([[-15, unit]]),
          date([[-30, unit]]),
        ]);
        withStartingFrom("Previous", [10, unit], [10, unit]);
        // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
        cy.findByText("Showing 2 rows").should("exist");
      }),
    );

    STARTING_FROM_UNITS.forEach((unit) =>
      it(`should work with Next filters (${unit} from now)`, () => {
        nativeSQL([
          now,
          date([[1, unit]]),
          date([[14, unit]]),
          date([[15, unit]]),
          date([[30, unit]]),
        ]);
        withStartingFrom("Next", [10, unit], [10, unit]);
        // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
        cy.findByText("Showing 2 rows").should("exist");
      }),
    );

    it("should not clobber filter when value is set to 1", () => {
      H.openOrdersTable();

      H.tableHeaderClick("Created At");

      H.popover().within(() => {
        cy.findByText("Filter by this column").click();
        cy.icon("chevronleft").should("not.exist");
        cy.findByText("Previous 30 days").click();
      });

      cy.wait("@dataset");

      cy.findByTestId("qb-filters-panel")
        .findByText("Created At is in the previous 30 days")
        .click();

      setRelativeDatetimeValue(1);
      setRelativeDatetimeUnit("year");
      addStartingFrom();
      setStartingFromValue(2);

      H.popover().button("Update filter").should("be.enabled");
    });
  });

  function assertOptions(expectedOptions) {
    cy.findAllByRole("option").each(($option, index) => {
      cy.wrap($option).should("have.text", expectedOptions[index]);
    });
  }

  describe("basic functionality", () => {
    it("starting from should contain units only equal or greater than the filter unit", () => {
      H.openOrdersTable();

      H.tableHeaderClick("Created At");
      H.clickActionsPopover().within(() => {
        cy.findByText("Filter by this column").click();
        cy.findByText("Relative date range…").click();
      });

      addStartingFrom();

      H.clickActionsPopover()
        .findByRole("textbox", { name: "Starting from unit" })
        .click();

      assertOptions([
        "days ago",
        "weeks ago",
        "months ago",
        "quarters ago",
        "years ago",
      ]);

      setRelativeDatetimeUnit(/quarters/);
      H.clickActionsPopover()
        .findByRole("textbox", { name: "Starting from unit" })
        .click();

      assertOptions(["quarters ago", "years ago"]);
    });

    it("should go back to shortcuts view", () => {
      H.openOrdersTable();

      H.tableHeaderClick("Created At");
      H.popover().within(() => {
        cy.findByText("Filter by this column").click();
        cy.findByText("Fixed date range…").click();
        cy.icon("chevronleft").first().click();
        cy.findByText("Fixed date range…").should("exist");
        cy.findByText("Between").should("not.exist");
      });
    });

    it("current filters should work (metabase#21977)", () => {
      H.openOrdersTable();

      H.tableHeaderClick("Created At");
      H.popover().within(() => {
        cy.findByText("Filter by this column").click();
        cy.findByText("Relative date range…").click();
        cy.findByText("Current").click();
        cy.findByText("Year").click();
      });
      cy.wait("@dataset");

      H.queryBuilderMain()
        .findByText("There was a problem with your question")
        .should("not.exist");

      cy.findByTestId("qb-filters-panel")
        .findByText("Created At is this year")
        .should("be.visible");
    });

    it("Relative dates should default to past filter (metabase#22027)", () => {
      H.openOrdersTable();

      H.tableHeaderClick("Created At");
      H.popover().within(() => {
        cy.findByText("Filter by this column").click();
        cy.findByText("Relative date range…").click();
        cy.findByText("Day").should("not.exist");
        cy.findByText("Quarter").should("not.exist");
        cy.findByText("Month").should("not.exist");
        cy.findByText("Year").should("not.exist");
        cy.findByDisplayValue("days").should("exist");
      });
    });

    it("should change the starting from units to match (metabase#22222)", () => {
      H.openOrdersTable();

      openCreatedAt("Previous");
      addStartingFrom();
      setRelativeDatetimeUnit("months");
      H.clickActionsPopover().within(() => {
        cy.findByDisplayValue("days ago").should("not.exist");
        cy.findByDisplayValue("months ago").should("exist");
      });
    });

    it("should allow changing values with starting from (metabase#22227)", () => {
      H.openOrdersTable();

      openCreatedAt("Previous");
      addStartingFrom();
      setRelativeDatetimeUnit("months");
      setRelativeDatetimeValue(1);
      H.popover().button("Add filter").click();
      cy.wait("@dataset");

      cy.findByTestId("qb-filters-panel")
        .findByText(
          "Created At is in the previous month, starting 7 months ago",
        )
        .click();
      setRelativeDatetimeValue(3);
      H.popover().button("Update filter").click();
      cy.wait("@dataset");

      cy.findByTestId("qb-filters-panel")
        .findByText(
          "Created At is in the previous 3 months, starting 7 months ago",
        )
        .click();
      setStartingFromValue(30);
      H.popover().button("Update filter").click();
      cy.wait("@dataset");

      cy.findByTestId("qb-filters-panel")
        .findByText(
          "Created At is in the previous 3 months, starting 30 months ago",
        )
        .should("be.visible");
    });

    it("starting from option should set correct sign (metabase#22228)", () => {
      H.openOrdersTable();

      openCreatedAt("Next");
      addStartingFrom();
      H.popover().button("Add filter").click();
      cy.wait("@dataset");

      cy.findByTestId("qb-filters-panel").within(() => {
        const baseName = "Created At is in the next 30 days";
        cy.findByText(`${baseName}, starting 7 days from now`).should(
          "be.visible",
        );
        cy.findByText(`${baseName}, starting 7 days ago`).should("not.exist");
      });
    });
  });
});

const nativeSQL = (values) => {
  cy.intercept("POST", "/api/dataset").as("dataset");

  const queries = values.map((value) => {
    const date = dayjs(value).utc();
    return `SELECT '${date.toISOString()}'::timestamp as "testcol"`;
  });

  H.createNativeQuestion(
    {
      name: "datetime",
      native: {
        query: queries.join(" UNION ALL "),
      },
    },
    { visitQuestion: true },
  );

  cy.findByText("Explore results").click();
  cy.wait("@dataset");
};

const openCreatedAt = (tab) => {
  H.tableHeaderClick("Created At");
  H.popover().within(() => {
    cy.findByText("Filter by this column").click();
    cy.findByText("Relative date range…").click();
    tab && cy.findByText(tab).click();
  });
};

const addStartingFrom = () => {
  H.popover()
    .findByLabelText(/Starting from/)
    .click();
};

const setRelativeDatetimeUnit = (unit) => {
  cy.findByRole("textbox", { name: "Unit" }).click();
  cy.findByRole("option", { name: unit }).click();
};

const setRelativeDatetimeValue = (value) => {
  cy.findByLabelText("Interval").click().clear().type(value).blur();
};

const setStartingFromValue = (value) => {
  cy.findByLabelText("Starting from interval")
    .click()
    .clear()
    .type(value)
    .blur();
};

const withStartingFrom = (dir, [num, unit], [startNum, startUnit]) => {
  H.tableHeaderClick("testcol");
  cy.findByTextEnsureVisible("Filter by this column").click();
  cy.findByTextEnsureVisible("Relative date range…").click();
  H.clickActionsPopover().within(() => {
    cy.findByText(dir).click();
  });

  H.relativeDatePicker.setValue({ unit, value: num }, H.clickActionsPopover);
  H.relativeDatePicker.addStartingFrom(
    {
      value: startNum,
      unit: startUnit + (dir === "Previous" ? " ago" : " from now"),
    },
    H.clickActionsPopover,
  );

  cy.intercept("POST", "/api/dataset").as("dataset");
  H.clickActionsPopover().within(() => cy.findByText("Add filter").click());
  cy.wait("@dataset");
};
