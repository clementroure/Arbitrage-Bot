import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";

export default function SetUniswapPrice() {
    const account = useAccount();

    return (
        <Dialog>
            <DialogTrigger>
                <Button>Set Uniswap Price </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Uniswap Price </DialogTitle>
                    <DialogDescription>
                        {" "}
                        Set the price of the pair on Uniswap{" "}
                    </DialogDescription>
                </DialogHeader>
                <Label> Desired Price </Label>
                <Input type="number" placeholder="Desired Price" />
            </DialogContent>
        </Dialog>
    );
}
