const { H } = cy;

const STRING_CASES = [
  {
    title: "is",
    columnName: "Category",
    operator: "Is",
    options: ["Widget"],
    expectedDisplayName: "Category is Widget",
    expectedRowCount: 54,
  },
  {
    title: "is, multiple options",
    columnName: "Category",
    operator: "Is",
    options: ["Widget", "Gadget"],
    expectedDisplayName: "Category is 2 selections",
    expectedRowCount: 107,
  },
  {
    title: "is not",
    columnName: "Category",
    operator: "Is not",
    options: ["Widget"],
    expectedDisplayName: "Category is not Widget",
    expectedRowCount: 146,
  },
  {
    title: "contains",
    columnName: "Title",
    operator: "Contains",
    values: ["Al"],
    expectedDisplayName: "Title contains Al",
    expectedRowCount: 47,
  },
  {
    title: "contains, multiple options",
    columnName: "Title",
    operator: "Contains",
    values: ["Al", "Me"],
    expectedDisplayName: "Title contains 2 selections",
    expectedRowCount: 68,
  },
  {
    title: "contains, multiple options, case sensitive",
    columnName: "Title",
    operator: "Contains",
    values: ["Al", "Me"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title contains 2 selections",
    expectedRowCount: 28,
  },
  {
    title: "contains, case sensitive",
    columnName: "Title",
    operator: "Contains",
    values: ["Al"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title contains Al",
    expectedRowCount: 16,
  },
  {
    title: "does not contain",
    columnName: "Title",
    operator: "Does not contain",
    values: ["Al"],
    expectedDisplayName: "Title does not contain Al",
    expectedRowCount: 153,
  },
  {
    title: "does not contain, multiple options",
    columnName: "Title",
    operator: "Does not contain",
    values: ["Al", "Me"],
    expectedDisplayName: "Title does not contain 2 selections",
    expectedRowCount: 132,
  },
  {
    title: "does not contain, multiple options, case sensitive",
    columnName: "Title",
    operator: "Does not contain",
    values: ["Al", "Me"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title does not contain 2 selections",
    expectedRowCount: 172,
  },
  {
    title: "does not contain, case sensitive",
    columnName: "Title",
    operator: "Does not contain",
    values: ["Al"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title does not contain Al",
    expectedRowCount: 184,
  },
  {
    title: "starts with",
    columnName: "Title",
    operator: "Starts with",
    values: ["sm"],
    expectedDisplayName: "Title starts with sm",
    expectedRowCount: 11,
  },
  {
    title: "starts with, multiple options",
    columnName: "Title",
    operator: "Starts with",
    values: ["sm", "Me"],
    expectedDisplayName: "Title starts with 2 selections",
    expectedRowCount: 25,
  },
  {
    title: "starts with, multiple options, case sensitive",
    columnName: "Title",
    operator: "Starts with",
    values: ["sm", "Me"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title starts with 2 selections",
    expectedRowCount: 14,
  },
  {
    title: "starts with, case sensitive",
    columnName: "Title",
    operator: "Starts with",
    values: ["sm"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title starts with sm",
    expectedRowCount: 0,
  },
  {
    title: "ends with",
    columnName: "Title",
    operator: "Ends with",
    values: ["At"],
    expectedDisplayName: "Title ends with At",
    expectedRowCount: 22,
  },
  {
    title: "ends with, multiple options",
    columnName: "Title",
    operator: "Ends with",
    values: ["At", "es"],
    expectedDisplayName: "Title ends with 2 selections",
    expectedRowCount: 38,
  },
  {
    title: "ends with, multiple options, case sensitive",
    columnName: "Title",
    operator: "Ends with",
    values: ["At", "es"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title ends with 2 selections",
    expectedRowCount: 16,
  },
  {
    title: "ends with, case sensitive",
    columnName: "Title",
    operator: "Ends with",
    values: ["At"],
    options: ["Case sensitive"],
    expectedDisplayName: "Title ends with At",
    expectedRowCount: 0,
  },
  {
    title: "is empty",
    columnName: "Title",
    operator: "Is empty",
    expectedDisplayName: "Title is empty",
    expectedRowCount: 0,
  },
  {
    title: "is not empty",
    columnName: "Title",
    operator: "Not empty",
    expectedDisplayName: "Title is not empty",
    expectedRowCount: 200,
  },
];

const NUMBER_CASES = [
  {
    title: "equal to",
    columnName: "Rating",
    operator: "Equal to",
    values: ["4"],
    expectedDisplayName: "Rating is equal to 4",
    expectedRowCount: 37,
  },
  {
    title: "equal to, multiple values",
    columnName: "Rating",
    operator: "Equal to",
    values: ["4", "5"],
    expectedDisplayName: "Rating is equal to 2 selections",
    expectedRowCount: 40,
  },
  {
    title: "not equal to",
    columnName: "Rating",
    operator: "Not equal to",
    values: ["4"],
    expectedDisplayName: "Rating is not equal to 4",
    expectedRowCount: 163,
  },
  {
    title: "greater than",
    columnName: "Price",
    operator: "Greater than",
    values: ["47.5"],
    expectedDisplayName: "Price is greater than 47.5",
    expectedRowCount: 111,
  },
  {
    title: "less than",
    columnName: "Price",
    operator: "Less than",
    values: ["47.5"],
    expectedDisplayName: "Price is less than 47.5",
    expectedRowCount: 89,
  },
  {
    title: "greater than or equal to",
    columnName: "Price",
    operator: "Greater than or equal to",
    values: ["47.5"],
    expectedDisplayName: "Price is greater than or equal to 47.5",
    expectedRowCount: 111,
  },
  {
    title: "less than or equal to",
    columnName: "Price",
    operator: "Less than or equal to",
    values: ["47.5"],
    expectedDisplayName: "Price is less than or equal to 47.5",
    expectedRowCount: 89,
  },
  {
    title: "is empty",
    columnName: "Price",
    operator: "Is empty",
    expectedDisplayName: "Price is empty",
    expectedRowCount: 0,
  },
  {
    title: "not empty",
    columnName: "Price",
    operator: "Not empty",
    expectedDisplayName: "Price is not empty",
    expectedRowCount: 200,
  },
];

const DATE_SHORTCUT_CASES = [
  {
    title: "today",
    shortcut: "Today",
    expectedDisplayName: "Created At is today",
  },
  {
    title: "yesterday",
    shortcut: "Yesterday",
    expectedDisplayName: "Created At is yesterday",
  },
  {
    title: "previous week",
    shortcut: "Previous week",
    expectedDisplayName: "Created At is in the previous week",
  },
  {
    title: "previous 7 days",
    shortcut: "Previous 7 days",
    expectedDisplayName: "Created At is in the previous 7 days",
  },
  {
    title: "previous 30 days",
    shortcut: "Previous 30 days",
    expectedDisplayName: "Created At is in the previous 30 days",
  },
  {
    title: "previous month",
    shortcut: "Previous month",
    expectedDisplayName: "Created At is in the previous month",
  },
  {
    title: "previous 3 months",
    shortcut: "Previous 3 months",
    expectedDisplayName: "Created At is in the previous 3 months",
  },
  {
    title: "previous 12 months",
    shortcut: "Previous 12 months",
    expectedDisplayName: "Created At is in the previous 12 months",
  },
];

const EXCLUDE_DATE_CASES = [
  {
    title: "day of week",
    label: "Days of the week…",
    options: ["Monday"],
    expectedDisplayName: "Created At excludes Mondays",
    expectedRowCount: 166,
  },
  {
    title: "day of week, multiple",
    label: "Days of the week…",
    options: ["Monday", "Wednesday"],
    expectedDisplayName: "Created At excludes 2 day of week selections",
    expectedRowCount: 132,
  },
  {
    title: "month of year",
    label: "Months of the year…",
    options: ["July"],
    expectedDisplayName: "Created At excludes each Jul",
    expectedRowCount: 182,
  },
  {
    title: "month of year, multiple",
    label: "Months of the year…",
    options: ["July", "May"],
    expectedDisplayName: "Created At excludes 2 month of year selections",
    expectedRowCount: 163,
  },
  {
    title: "quarter of year",
    label: "Quarters of the year…",
    options: ["1st"],
    expectedDisplayName: "Created At excludes Q1 each year",
    expectedRowCount: 154,
  },
  {
    title: "quarter of year, multiple",
    label: "Quarters of the year…",
    options: ["1st", "4th"],
    expectedDisplayName: "Created At excludes 2 quarter of year selections",
    expectedRowCount: 102,
  },
  {
    title: "hour of day",
    label: "Hours of the day…",
    options: ["1 AM"],
    expectedDisplayName: "Created At excludes the hour of 1 AM",
    expectedRowCount: 191,
  },
  {
    title: "quarter of year, multiple",
    label: "Hours of the day…",
    options: ["1 AM", "10 AM", "5 PM"],
    expectedDisplayName: "Created At excludes 3 hour of day selections",
    expectedRowCount: 183,
  },
  {
    title: "empty values",
    label: "Empty values",
    expectedDisplayName: "Created At is not empty",
    expectedRowCount: 200,
  },
  {
    title: "not empty values",
    label: "Not empty values",
    expectedDisplayName: "Created At is empty",
    expectedRowCount: 0,
  },
];

const RELATIVE_DATE_CASES = [
  // Past
  {
    title: "yesterday",
    offset: "Previous",
    unit: "day",
    value: 1,
    expectedDisplayName: "Created At is today or yesterday",
    includeCurrent: true,
  },
  {
    title: "previous 7 days",
    offset: "Previous",
    unit: "days",
    value: 7,
    expectedDisplayName: "Created At is in the previous 7 days",
  },
  {
    title: "previous 3 weeks starting a quarter ago",
    offset: "Previous",
    unit: "weeks",
    value: 3,
    offsetUnit: "quarter",
    offsetValue: 1,
    expectedDisplayName:
      "Created At is in the previous 3 weeks, starting 1 quarter ago",
  },
  {
    title: "previous month",
    offset: "Previous",
    unit: "month",
    value: 1,
    expectedDisplayName: "Created At is in the previous month or this month",
    includeCurrent: true,
  },
  {
    title: "previous 3 months",
    offset: "Previous",
    unit: "months",
    value: 3,
    expectedDisplayName: "Created At is in the previous 3 months",
  },
  {
    title: "previous two quarters",
    offset: "Previous",
    unit: "quarters",
    value: 2,
    expectedDisplayName:
      "Created At is in the previous 2 quarters or this quarter",
    includeCurrent: true,
  },

  // Next
  {
    title: "next 6 hours",
    offset: "Next",
    unit: "hours",
    value: 6,
    expectedDisplayName: "Created At is in the next 6 hours or this hour",
    includeCurrent: true,
  },
  {
    title: "tomorrow",
    offset: "Next",
    unit: "day",
    value: 1,
    expectedDisplayName: "Created At is tomorrow",
  },
  {
    title: "next 7 days starting next month",
    offset: "Next",
    unit: "days",
    value: 7,
    offsetUnit: "month",
    offsetValue: 1,
    expectedDisplayName:
      "Created At is in the next 7 days, starting 1 month from now",
  },
  {
    title: "next year",
    offset: "Next",
    unit: "year",
    value: 1,
    expectedDisplayName: "Created At is in the next year",
  },
];

describe("scenarios > filters > filter types", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsNormalUser();
  });

  describe("string filters", () => {
    STRING_CASES.forEach(
      ({
        title,
        columnName,
        operator,
        values = [],
        options = [],
        expectedDisplayName,
        expectedRowCount,
      }) => {
        it(title, () => {
          H.openProductsTable({ mode: "notebook" });
          H.filter({ mode: "notebook" });

          H.clauseStepPopover().findByText(columnName).click();
          H.selectFilterOperator(operator);
          H.clauseStepPopover().within(() => {
            values.forEach((value) => {
              cy.findByLabelText("Filter value")
                .focus()
                .type(`${value},`, { delay: 50 })
                .blur();
            });
            options.forEach((option) => cy.findByText(option).click());
            cy.button("Add filter").click();
          });

          assertFilterName(expectedDisplayName);
          H.visualize();
          H.assertQueryBuilderRowCount(expectedRowCount);
        });
      },
    );
  });

  describe("number filters", () => {
    NUMBER_CASES.forEach(
      ({
        title,
        columnName,
        operator,
        values = [],
        expectedDisplayName,
        expectedRowCount,
      }) => {
        it(title, () => {
          H.openProductsTable({ mode: "notebook" });
          H.filter({ mode: "notebook" });

          H.clauseStepPopover().findByText(columnName).click();
          H.selectFilterOperator(operator);
          H.clauseStepPopover().within(() => {
            values.forEach((value) => {
              cy.findByLabelText("Filter value")
                .focus()
                .type(`${value},`, { delay: 50 })
                .blur();
            });
            cy.button("Add filter").click();
          });

          assertFilterName(expectedDisplayName);
          H.visualize();
          H.assertQueryBuilderRowCount(expectedRowCount);
        });
      },
    );
  });

  describe("date filters", () => {
    describe("shortcuts", () => {
      DATE_SHORTCUT_CASES.forEach(
        ({ title, shortcut, expectedDisplayName }) => {
          it(title, () => {
            H.openProductsTable({ mode: "notebook" });
            H.filter({ mode: "notebook" });

            H.clauseStepPopover().within(() => {
              cy.findByText("Created At").click();
              cy.findByText(shortcut).click();
            });
            assertFilterName(expectedDisplayName);
            H.visualize();
            assertFiltersExist();
          });
        },
      );
    });

    describe("relative filters", () => {
      RELATIVE_DATE_CASES.forEach(
        ({
          title,
          offset,
          value,
          unit,
          offsetUnit,
          offsetValue,
          includeCurrent,
          expectedDisplayName,
        }) => {
          it(title, () => {
            H.openProductsTable({ mode: "notebook" });
            H.filter({ mode: "notebook" });

            H.clauseStepPopover().within(() => {
              cy.findByText("Created At").click();
              cy.findByText("Relative date range…").click();
              cy.findByRole("tab", { name: offset }).click();
            });

            H.relativeDatePicker.setValue({ value, unit }, H.clauseStepPopover);

            if (includeCurrent) {
              H.relativeDatePicker.toggleCurrentInterval(H.clauseStepPopover);
            } else if (offsetUnit && offsetValue) {
              H.relativeDatePicker.addStartingFrom(
                {
                  value: offsetValue,
                  unit: offsetUnit,
                },
                H.clauseStepPopover,
              );
            }

            H.clauseStepPopover().button("Add filter").click();

            assertFilterName(expectedDisplayName);
            H.visualize();
            assertFiltersExist();
          });
        },
      );
    });

    describe("exclude dates", () => {
      EXCLUDE_DATE_CASES.forEach(
        ({ title, label, options, expectedDisplayName, expectedRowCount }) => {
          it(title, () => {
            H.openProductsTable({ mode: "notebook" });
            H.filter({ mode: "notebook" });

            H.clauseStepPopover().within(() => {
              cy.findByText("Created At").click();
              cy.findByText("Exclude…").click();
              cy.findByText(label).click();
              if (options) {
                options.forEach((option) => cy.findByText(option).click());
                cy.button("Add filter").click();
              }
            });
            assertFilterName(expectedDisplayName);
            H.visualize();
            H.assertQueryBuilderRowCount(expectedRowCount);
          });
        },
      );
    });
  });
});

function assertFilterName(filterName, options) {
  H.getNotebookStep("filter", options)
    .findByText(filterName)
    .should("be.visible");
}

function assertFiltersExist() {
  cy.findByTestId("qb-filters-panel").should("be.visible");
}
