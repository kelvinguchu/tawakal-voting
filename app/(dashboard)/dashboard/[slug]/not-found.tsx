import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className='container mx-auto px-4 sm:px-6 py-8 sm:py-12'>
      <div className='max-w-sm sm:max-w-md mx-auto text-center'>
        <Card className='border-2 sm:border'>
          <CardHeader className='px-4 sm:px-6 pt-6 sm:pt-8'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-tawakal-blue/10 flex items-center justify-center'>
              <Search className='w-6 h-6 sm:w-8 sm:h-8 text-tawakal-blue' />
            </div>
            <CardTitle className='text-lg sm:text-xl text-tawakal-blue'>
              Poll Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 px-4 sm:px-6 pb-6 sm:pb-8'>
            <p className='text-sm sm:text-base text-muted-foreground'>
              The poll you're looking for doesn't exist or may have been
              removed.
            </p>
            <div className='space-y-2 sm:space-y-3'>
              <Link href='/dashboard'>
                <Button className='w-full h-10 sm:h-11 text-sm sm:text-base bg-tawakal-blue hover:bg-tawakal-blue/90'>
                  <ChevronLeft className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href='/polls'>
                <Button
                  variant='outline'
                  className='w-full h-10 sm:h-11 text-sm sm:text-base'>
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
