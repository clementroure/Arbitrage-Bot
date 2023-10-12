"use client";

import * as React from "react";
import {
    CaretSortIcon,
    ChevronDownIcon,
    DotsHorizontalIcon,
} from "@radix-ui/react-icons";
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
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EyeIcon, Plus, Trash2 } from "lucide-react";
import { Pair, TokenList, usePairsStore, useTokensStore } from "../lib/pairs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import usePriceStore from "../lib/priceDataStore";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Client } from "../lib/client";

export const columns: ColumnDef<Pair>[] = [
    {
        header: "Name",
        id: "name",
        accessorFn: (pair) => `${pair.tokenA.name}/${pair.tokenB.name}`,
    },
    {
        header: "Average Price",
        cell: ({ row }) => {
            const { getAverageQuote } = usePriceStore();
            const quote = getAverageQuote(
                row.original.tokenA?.address, row.original.tokenB?.address
            );
            return (
                <div>
                    {quote.average} -{" "}
                    <Badge className="p-1">{quote.count} exchanges</Badge>
                </div>
            );
        },
    },
    {
        header: "Spread",
        cell: ({ row }) => {
            const { getAllQuotes } = usePriceStore();
            const allQuotes = getAllQuotes(
                row.original.tokenA.address, row.original.tokenB.address
            );
            const min = Math.min(...allQuotes.map((quote) => quote.price));
            const max = Math.max(...allQuotes.map((quote) => quote.price));
            const spread = ((max - min) / min) * 100;
            return <div>{spread.toFixed(2)}%</div>;
        },
    },
    {
        id: "preview",
        enableHiding: false,
        cell: ({ row }) => {
            const pair = row.original;
            const { getAverageQuote, getAllQuotes } = usePriceStore();
            const quote = getAverageQuote(
                row.original.tokenA.address, row.original.tokenB.address
            );
            const allQuotes = getAllQuotes(
                row.original.tokenA.address, row.original.tokenB.address
            );

            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open preview</span>
                            <EyeIcon className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{`${pair.tokenA.name}/${pair.tokenB.name}`}</DialogTitle>
                            <DialogDescription>
                                There are {quote.count} exchanges for this pair,
                                with an average price of {quote.average}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {allQuotes.map((quote) => (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="name"
                                            className="text-right"
                                        >
                                            {quote.exchangeName}
                                        </Label>
                                        <div className="col-span-3">
                                            <span className="text-sm font-medium text-gray-900">
                                                {quote.price}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                <TimeAgo
                                                    date={quote.timestamp}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            );
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const pair = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                usePairsStore.getState().removePair(pair);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

const TimeAgo = ({ date }) => {
    const calculateTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return diffInSeconds + " seconds ago";
        else if (diffInSeconds < 3600)
            return Math.floor(diffInSeconds / 60) + " minutes ago";
        else if (diffInSeconds < 86400)
            return Math.floor(diffInSeconds / 3600) + " hours ago";
        else return Math.floor(diffInSeconds / 86400) + " days ago";
    };

    const [timeAgo, setTimeAgo] = React.useState(calculateTimeAgo(date));

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeAgo(calculateTimeAgo(date));
        }, 1000); // update every second

        return () => {
            clearInterval(timer); // cleanup on unmount
        };
    }, [date]);

    return <div>{timeAgo}</div>;
};

export function PairsView() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const { tokens } = useTokensStore();
    const { pairs, addPair } = usePairsStore();

    // New states for the form inputs
    const [tokenA, setTokenA] = React.useState({});
    const [tokenB, setTokenB] = React.useState({});

    const [open, setOpen] = React.useState(false);
    const handleAddPair = () => {
        const newToken: Pair = { tokenA, tokenB };
        addPair(newToken);
        setTokenA({});
        setTokenB({});
        setOpen(false);
        Client.shared.subscribeToAll();
    };

    const table = useReactTable({
        data: pairs() as Pair[],
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
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
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter pairs..."
                    value={
                        (table.getColumn("name")?.getFilterValue() as string) ??
                        ""
                    }
                    onChange={(event) =>
                        table
                            .getColumn("name")
                            ?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
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
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            New Pair
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>New Pair</DialogTitle>
                            <DialogDescription>
                                Add a new pair to the list
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Token A
                                </Label>
                                <Select onValueChange={setTokenA}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a token" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Tokens</SelectLabel>
                                            {
                                                tokens.map((token) => {
                                                    return (
                                                        <SelectItem value={token} key={token.address || token.name}>
                                                            <div className="flex items-center space-x-2">
                                                                {(TokenList[token.ticker] ?? {}).icon}
                                                                {token.name}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Token B
                                </Label>
                                <Select onValueChange={setTokenB}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a token" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Tokens</SelectLabel>
                                            {
                                                tokens.map((token) => {
                                                    return (
                                                        <SelectItem value={token} key={token.address || token.name}>
                                                            <div className="flex items-center space-x-2">
                                                                {(TokenList[token.ticker] ?? {}).icon}
                                                                {token.name}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddPair}>
                                Submit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
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
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
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
