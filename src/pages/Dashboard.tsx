
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  ArrowRight, 
  Eye, 
  Clock, 
  LineChart, 
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useState, useCallback } from "react";

interface SurveyItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  responses: number;
  status: string;
}

interface SuggestionItem {
  id: string;
  content: string;
  customerName: string;
  createdAt: string;
  status: string;
}

interface RequirementItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
  status: string;
}

interface UpdateStatusParams {
  id: string;
  type: string;
  newStatus: string;
}

interface ConfirmDialogState {
  open: boolean;
  id: string;
  type: string;
  newStatus: string;
  currentStatus: string;
}

const fetchLatestSurvey = async (): Promise<SurveyItem> => {
  return {
    id: "1",
    title: "Encuesta de Satisfacción del Cliente",
    description: "Recopilar opiniones sobre la calidad de nuestro servicio al cliente",
    createdAt: "2023-12-15T12:00:00Z",
    responses: 8,
    status: "in-progress"
  };
};

const fetchLatestSuggestion = async (): Promise<SuggestionItem> => {
  return {
    id: "1",
    content: "Agregar modo oscuro al portal del cliente",
    customerName: "Juan Pérez",
    createdAt: "2023-12-10T09:30:00Z",
    status: "pending"
  };
};

const fetchLatestRequirement = async (): Promise<RequirementItem> => {
  return {
    id: "1",
    title: "Diseño responsivo para móviles",
    description: "La aplicación debe ser completamente responsiva en todos los dispositivos móviles",
    priority: "high",
    createdAt: "2023-12-05T14:20:00Z",
    status: "closed"
  };
};

const updateStatus = async ({ id, type, newStatus }: UpdateStatusParams) => {
  console.log(`Actualizando ${type} con id ${id} a estado: ${newStatus}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { id, type, status: newStatus };
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" /> Pendiente
        </Badge>
      );
    case "in-progress":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <LineChart className="h-3 w-3 mr-1" /> En curso
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Cerrada
        </Badge>
      );
    default:
      return null;
  }
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    id: "",
    type: "",
    newStatus: "",
    currentStatus: ""
  });

  const { data: latestSurvey, isLoading: loadingSurvey } = useQuery({
    queryKey: ['latestSurvey'],
    queryFn: fetchLatestSurvey
  });

  const { data: latestSuggestion, isLoading: loadingSuggestion } = useQuery({
    queryKey: ['latestSuggestion'],
    queryFn: fetchLatestSuggestion
  });

  const { data: latestRequirement, isLoading: loadingRequirement } = useQuery({
    queryKey: ['latestRequirement'],
    queryFn: fetchLatestRequirement
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: (data) => {
      const queryKey = data.type === 'Survey' 
        ? 'latestSurvey' 
        : data.type === 'Suggestion' 
          ? 'latestSuggestion' 
          : 'latestRequirement';
      
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          status: data.status
        };
      });
      
      toast.success(`Estado actualizado a ${getStatusLabel(data.status)}`);
      
      // Close dialog by creating a new state object with open: false
      setDialogState({
        open: false,
        id: "",
        type: "",
        newStatus: "",
        currentStatus: ""
      });
    },
    onError: (error) => {
      console.error("Error al actualizar el estado:", error);
      toast.error("Error al actualizar el estado");
      
      // Close dialog by creating a new state object with open: false
      setDialogState({
        open: false,
        id: "",
        type: "",
        newStatus: "",
        currentStatus: ""
      });
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "in-progress": return "En curso";
      case "closed": return "Cerrada";
      default: return status;
    }
  };

  // Memoize this function to prevent unnecessary re-renders
  const handleStatusChange = useCallback((id: string, type: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) {
      return;
    }
    
    // Create a completely new state object to avoid partial updates
    setDialogState({
      open: true,
      id,
      type,
      newStatus,
      currentStatus
    });
  }, []);

  const confirmStatusChange = useCallback(() => {
    // Only proceed if we have valid data
    const { id, type, newStatus } = dialogState;
    if (id && type && newStatus) {
      updateStatusMutation.mutate({
        id,
        type,
        newStatus
      });
    }
  }, [dialogState, updateStatusMutation]);

  const closeDialog = useCallback(() => {
    // Create a completely new state object with open: false
    setDialogState({
      open: false,
      id: "",
      type: "",
      newStatus: "",
      currentStatus: ""
    });
  }, []);

  // Handle dialog open state changes
  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeDialog();
    }
  }, [closeDialog]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-20 pb-10 px-4 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Panel de Control</h1>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Vista Rápida de Elementos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm text-muted-foreground">Última Encuesta</h3>
                    {latestSurvey && <StatusBadge status={latestSurvey.status} />}
                  </div>
                  <p className="font-semibold">{latestSurvey?.title || "No hay encuestas aún"}</p>
                  {latestSurvey && (
                    <p className="text-xs text-muted-foreground">
                      Creada {formatDate(latestSurvey.createdAt)} • {latestSurvey.responses} respuestas
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {latestSurvey && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          type="button"
                        >
                          <span>Cambiar Estado</span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSurvey.id, "Survey", "pending", latestSurvey.status)}
                          disabled={latestSurvey.status === "pending"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Pendiente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSurvey.id, "Survey", "in-progress", latestSurvey.status)}
                          disabled={latestSurvey.status === "in-progress"}
                        >
                          <LineChart className="mr-2 h-4 w-4" />
                          <span>En curso</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSurvey.id, "Survey", "closed", latestSurvey.status)}
                          disabled={latestSurvey.status === "closed"}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          <span>Cerrada</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {latestSurvey && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link to={`/survey/${latestSurvey.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm text-muted-foreground">Última Sugerencia</h3>
                    {latestSuggestion && <StatusBadge status={latestSuggestion.status} />}
                  </div>
                  <p className="font-semibold">{latestSuggestion?.content || "No hay sugerencias aún"}</p>
                  {latestSuggestion && (
                    <p className="text-xs text-muted-foreground">
                      De {latestSuggestion.customerName} • {formatDate(latestSuggestion.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {latestSuggestion && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          type="button"
                        >
                          <span>Cambiar Estado</span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSuggestion.id, "Suggestion", "pending", latestSuggestion.status)}
                          disabled={latestSuggestion.status === "pending"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Pendiente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSuggestion.id, "Suggestion", "in-progress", latestSuggestion.status)}
                          disabled={latestSuggestion.status === "in-progress"}
                        >
                          <LineChart className="mr-2 h-4 w-4" />
                          <span>En curso</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestSuggestion.id, "Suggestion", "closed", latestSuggestion.status)}
                          disabled={latestSuggestion.status === "closed"}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          <span>Cerrada</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {latestSuggestion && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      asChild
                      type="button"
                    >
                      <Link to="/suggestions">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-start justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm text-muted-foreground">Último Requerimiento</h3>
                    {latestRequirement && <StatusBadge status={latestRequirement.status} />}
                  </div>
                  <p className="font-semibold">{latestRequirement?.title || "No hay requerimientos aún"}</p>
                  {latestRequirement && (
                    <p className="text-xs text-muted-foreground">
                      Prioridad: {latestRequirement.priority === 'high' ? 'Alta' : latestRequirement.priority === 'medium' ? 'Media' : 'Baja'} • {formatDate(latestRequirement.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {latestRequirement && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          type="button"
                        >
                          <span>Cambiar Estado</span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestRequirement.id, "Requirement", "pending", latestRequirement.status)}
                          disabled={latestRequirement.status === "pending"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Pendiente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestRequirement.id, "Requirement", "in-progress", latestRequirement.status)}
                          disabled={latestRequirement.status === "in-progress"}
                        >
                          <LineChart className="mr-2 h-4 w-4" />
                          <span>En curso</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(latestRequirement.id, "Requirement", "closed", latestRequirement.status)}
                          disabled={latestRequirement.status === "closed"}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          <span>Cerrada</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {latestRequirement && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      asChild
                      type="button"
                    >
                      <Link to="/requirements">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Link to="/results">
                <Button size="sm" type="button">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Análisis
                </Button>
              </Link>
              <Link to="/surveys">
                <Button variant="outline" size="sm" type="button">
                  Ver Todas las Encuestas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={dialogState.open} 
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar el estado?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que deseas cambiar el estado de
              {dialogState.type === 'Survey' && ' esta encuesta '}
              {dialogState.type === 'Suggestion' && ' esta sugerencia '}
              {dialogState.type === 'Requirement' && ' este requerimiento '}
              de <strong>{getStatusLabel(dialogState.currentStatus)}</strong> a <strong>{getStatusLabel(dialogState.newStatus)}</strong>?</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeDialog}
              type="button"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
              type="button"
            >
              {updateStatusMutation.isPending ? "Actualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
