import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function TopPositionBet() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Bet on Top Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="influencer">Predicted Top Influencer</Label>
            <Input id="influencer" placeholder="@cryptohandle" />
          </div>
          <div>
            <Label htmlFor="amount">Bet Amount (USD)</Label>
            <Input id="amount" type="number" placeholder="100" />
          </div>
          <Button className="w-full bg-blue-500 hover:bg-blue-600">
            Place Bet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
