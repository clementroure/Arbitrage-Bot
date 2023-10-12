import useTradeBookStore from "../lib/tradesStore";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    FilterFn,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    MoreHorizontal,
    ChevronDown,
    Trash,
    Trash2,
    ArrowRight,
    ExternalLink,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { set } from "zod";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { TokenList } from "../lib/pairs";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExchangesList } from "../lib/exchanges";
import { useEnvironment } from "../lib/environment";
import { Skeleton } from "@/components/ui/skeleton";

export type Trade = {
    timestamp: number;
    pair: string;
    startAmount: number;
    route: { exchange: string; token: string }[];
    profit: number;
    fees: number;
};

interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
}

export function DataTable<TData extends Record<string, any>>({
    columns,
    data,
}: DataTableProps<TData>) {
    const { removeTrade } = useTradeBookStore();
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "timestamp", desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [globalFilter, setGlobalFilter] = React.useState("");

    // Global filter
    const filteredData: FilterFn<any> = (row, columnId, value, addMeta) => {
        if (value === "") return true;
        const val: string | number = row.getValue(columnId);
        if (typeof val === "string") {
            return val.toLowerCase().includes(value.toLowerCase());
        } else if (typeof val === "number") {
            return val.toString().includes(value);
        }
        return false;
    };

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn: filteredData,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter transactions..."
                    value={globalFilter}
                    onChange={(event) =>
                        setGlobalFilter(event.currentTarget.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, id) => (
                                <ContextMenu key={id}>
                                    <ContextMenuTrigger asChild>
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            onSelect={() => {
                                                removeTrade(
                                                    row.original.timestamp
                                                );
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Showing {table.getFilteredRowModel().rows.length} trades.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
}

function getToken(ticker: String) {
    const result = (
        TokenList[ticker as keyof typeof TokenList] ||
        TokenList[Object.keys(TokenList).find((key) => key.includes(ticker)) ?? ""] ||
        {}
    );
    return result;
}

export const columns: ColumnDef<Trade>[] = [
    {
        accessorKey: "timestamp",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Time
                    {column.getIsSorted() === "asc" && (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    )}
                    {column.getIsSorted() === "desc" && (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            );
        },
        cell: ({ cell }) => {
            return <div>{formatDate(cell.getValue())}</div>;
        },
    },
    {
        accessorKey: "txHash",
        header: "Tx Hash",
        cell: ({ cell }) => {
            const baseURL = useEnvironment.getState().environment === "production"
                ? "https://etherscan.io/tx/"
                : "https://testnet.bscscan.com/tx/"
            return (
                <div className="flex items-center space-x-2">
                    {cell.getValue()
                        ? <a
                            href={`${baseURL}${cell.getValue()}`}
                            target="_blank"
                            className="flex items-center space-x-2"
                        >
                            <div className="text-sm flex">
                                {/* Last few letters */}
                                <ExternalLink className="h-4 w-4" />
                                {`...${cell.getValue().slice(-8)}`}
                            </div>
                        </a>
                        : <Skeleton className="w-[100px] h-[20px] rounded-full" />
                    }
                </div>
            );
        },
    },
    {
        accessorKey: "startAmount",
        header: "Start Amount",
    },
    {
        header: "Route",
        cell: ({ row }) => {
            const { route } = row.original;
            const { environment } = useEnvironment();
            const exchanges =
                ExchangesList[environment as "development" | "production"];
            return (
                <div className="flex items-center space-x-2">
                    {route.map((step, index) => {
                        const exchange = exchanges[step.exchange] ?? {};
                        return (
                            <div
                                key={index}
                                className="flex items-center space-x-2"
                            >
                                {getToken(step.token).icon}
                                {index < route.length - 1 && (
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <ArrowRight className="h-4 w-4" />
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80 mt-0">
                                            <div className="flex justify-between items-center space-x-4 mt-0">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={exchange.icon}
                                                        className="mt-0"
                                                    />
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-semibold">
                                                        {exchange.name}
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        {getToken(step.token).icon}
                                                        <ArrowRight className="h-4 w-4" />
                                                        {getToken(route[index + 1].token).icon}
                                                    </div>
                                                    <div className="flex items-center pt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {exchange.routerAddress}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        },
    },
    {
        accessorKey: "profit",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Profit
                    {column.getIsSorted() === "asc" && (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    )}
                    {column.getIsSorted() === "desc" && (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            );
        },
    },
    {
        accessorKey: "fees",
        header: "Fees",
    },
];

export default function TradeBook() {
    const { trades } = useTradeBookStore();

    const [hydratedTrades, setHydratedTrades] = useState<Trade[]>([]);

    useEffect(() => {
        setHydratedTrades(trades);
    }, [trades]);

    return <DataTable columns={columns} data={hydratedTrades} />;
}
