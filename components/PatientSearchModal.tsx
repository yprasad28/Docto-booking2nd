"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, Phone, FileText, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PatientSearchAPI, type PatientSearchResult } from '@/lib/patient-search-api';

export function PatientSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<PatientSearchResult[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch patients data when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchRecentPatients();
    }
  }, [isOpen, user?.id]);

  const fetchRecentPatients = async () => {
    if (!user?.id) return;
    
    try {
      const recent = await PatientSearchAPI.getRecentPatients(user.id, 3);
      setRecentPatients(recent);
    } catch (error) {
      console.error('Error fetching recent patients:', error);
    }
  };

  // Search patients with debouncing
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients([]);
      return;
    }

    const searchPatients = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const results = await PatientSearchAPI.searchPatients(searchQuery, user.id);
        setFilteredPatients(results);
      } catch (error) {
        console.error('Error searching patients:', error);
        setFilteredPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user?.id]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handlePatientSelect = (patient: PatientSearchResult) => {
    setIsOpen(false);
    router.push(`/doctor/${user?.id}/patient-history/${patient.id}`);
  };

  const getDaysAgo = (dateString: string) => {
    const now = new Date();
    const visitDate = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - visitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStatusColor = (days: number) => {
    if (days <= 7) return 'bg-green-100 text-green-800';
    if (days <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <FileText className="w-4 h-4" />
          Patient History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Patient History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, mobile, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <Card 
                    key={patient.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {patient.mobile}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {patient.appointmentCount} visits
                          </Badge>
                          {patient.lastVisit && (
                            <div className="text-xs text-gray-500 mt-1">
                              Last: {getDaysAgo(patient.lastVisit)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p>No patients found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Patients */}
          {!searchQuery && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Patients
              </h3>
              {recentPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">{patient.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${patient.lastVisit ? getStatusColor(parseInt(getDaysAgo(patient.lastVisit).split(' ')[0])) : ''}`}
                        >
                          {patient.lastVisit ? getDaysAgo(patient.lastVisit) : 'No visits'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {patient.appointmentCount} total visits
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Quick Actions:</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/doctor/appointments')}
              >
                View All Appointments
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/doctor/patients')}
              >
                Patient Directory
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

