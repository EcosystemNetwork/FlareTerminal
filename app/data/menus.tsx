import { Option, Screen, ScreenOption } from "./interfaces";
import { ActionEnum } from "./action-enums";

const option = (message: string, actionId: ActionEnum): Option => ({
  message,
  actionId,
});

const blank = (): Option => option("", ActionEnum.NO_ACTION);

const row = (left: Option, right: Option): ScreenOption => ({ left, right });

const blankRow = (): ScreenOption => row(blank(), blank());

const backRow = (
  back: ActionEnum,
  right: Option = blank(),
  label = "<Back"
): ScreenOption => row(option(label, back), right);

const screen = (title: string, options: ScreenOption[]): Screen => ({
  title,
  options,
});

/** The three denomination rows shared by every "select amount" screen. */
const denominationRows = (): ScreenOption[] => [
  row(
    option("<100", ActionEnum.PROCESS_WITHDRAW_100),
    option("10>", ActionEnum.PROCESS_WITHDRAW_10)
  ),
  row(
    option("<50", ActionEnum.PROCESS_WITHDRAW_50),
    option("5>", ActionEnum.PROCESS_WITHDRAW_5)
  ),
  row(
    option("<20", ActionEnum.PROCESS_WITHDRAW_20),
    option("2>", ActionEnum.PROCESS_WITHDRAW_2)
  ),
];

/** A screen with a title, three empty rows and a back button. */
const infoScreen = (title: string, back: ActionEnum): Screen =>
  screen(title, [blankRow(), blankRow(), blankRow(), backRow(back)]);

/** Paged list of banknotes with select/print and previous/next controls. */
export const createBanknoteListScreen = (
  title: string,
  back: ActionEnum = ActionEnum.GO_MAIN_MENU
): Screen =>
  screen(title, [
    row(
      option("Select", ActionEnum.SELECT_BANKNOTE),
      option("Print", ActionEnum.PRINT_BANKNOTE)
    ),
    row(
      option("Previous", ActionEnum.PREVIOUS_BANKNOTE),
      option("Next", ActionEnum.NEXT_BANKNOTE)
    ),
    blankRow(),
    backRow(back),
  ]);

export const screenDisconnected: Screen = screen("Skeuomorphica Bank", [
  blankRow(),
  blankRow(),
  blankRow(),
  row(blank(), option("Sign in>", ActionEnum.PROCESS_LOGIN)),
]);

export const screenMainMenu: Screen = screen("Select amount", [
  ...denominationRows(),
  row(
    option("<Cancel", ActionEnum.PROCESS_LOGOUT),
    option("More>", ActionEnum.GO_MORE_OPTIONS)
  ),
]);

export const screenMoreOptions: Screen = screen("Select option", [
  row(
    option("<Balance", ActionEnum.GO_BALANCE),
    option("Deposit>", ActionEnum.GO_DEPOSIT)
  ),
  row(
    option("<Withdraw", ActionEnum.GO_WITHDRAW),
    option("Statement>", ActionEnum.VIEW_BANKNOTES)
  ),
  row(
    option("<Invest", ActionEnum.GO_INVEST),
    option("Currency>", ActionEnum.GO_CURRENCIES)
  ),
  row(
    option("<Cancel", ActionEnum.GO_MAIN_MENU),
    option("Settings>", ActionEnum.GO_SETTINGS)
  ),
]);

export const screenWithdrawMenu: Screen = screen("Select amount", [
  ...denominationRows(),
  row(
    option("<Cancel", ActionEnum.CANCEL_WITHDRAW),
    option("More>", ActionEnum.NO_ACTION)
  ),
]);

export const screenConfirm: Screen = screen("Please confirm", [
  blankRow(),
  blankRow(),
  blankRow(),
  row(
    option("<Cancel", ActionEnum.CANCEL_WITHDRAW),
    option("Print>", ActionEnum.EXECUTE_WITHDRAW)
  ),
]);

export const screenBalance: Screen = infoScreen(
  "Account Balance",
  ActionEnum.GO_MORE_OPTIONS
);

export const screenDeposit: Screen = infoScreen(
  "Deposit Funds",
  ActionEnum.GO_MORE_OPTIONS
);

export const screenWithdraw: Screen = screen("Withdraw Funds", [
  ...denominationRows(),
  backRow(ActionEnum.GO_MORE_OPTIONS, option("More>", ActionEnum.NO_ACTION)),
]);

export const screenStatement: Screen = createBanknoteListScreen(
  "Print Statement"
);

export const screenInvest: Screen = infoScreen(
  "Invest Funds",
  ActionEnum.GO_MORE_OPTIONS
);

export const screenCurrencies: Screen = screen("Select Currency", [
  row(
    option("<USDC", ActionEnum.NO_ACTION),
    option("ETH>", ActionEnum.NO_ACTION)
  ),
  row(
    option("<EUROC", ActionEnum.NO_ACTION),
    option("DOGE>", ActionEnum.NO_ACTION)
  ),
  row(
    option("<NZDT>", ActionEnum.NO_ACTION),
    option("PEPE>", ActionEnum.NO_ACTION)
  ),
  backRow(ActionEnum.GO_MORE_OPTIONS, option("More>", ActionEnum.NO_ACTION)),
]);

export const screenSettings: Screen = screen("Settings", [
  blankRow(),
  blankRow(),
  row(
    option("<Print Test Banknote", ActionEnum.PRINT_TEST_BANKNOTE),
    option("Execute Print>", ActionEnum.EXECUTE_PRINT_BANKNOTE)
  ),
  backRow(ActionEnum.GO_MORE_OPTIONS),
]);
