import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className='container mx-auto py-12'>
      <div className='max-w-md mx-auto text-center'>
        <Card>
          <CardHeader>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-tawakal-blue/10 flex items-center justify-center'>
              <Search className='w-8 h-8 text-tawakal-blue' />
            </div>
            <CardTitle className='text-xl text-tawakal-blue'>
              Poll Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              The poll you're looking for doesn't exist or may have been
              removed.
            </p>
            <div className='space-y-2'>
              <Link href='/dashboard'>
                <Button className='w-full bg-tawakal-blue hover:bg-tawakal-blue/90'>
                  <ChevronLeft className='w-4 h-4 mr-2' />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href='/polls'>
                <Button variant='outline' className='w-full'>
                  Browse All Polls
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
