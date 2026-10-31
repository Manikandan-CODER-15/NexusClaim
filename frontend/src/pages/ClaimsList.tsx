import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  IconButton,
  TablePagination,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ArrowForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Claim = {
  id: string;
  claim_number: string;
  claimant: string;
  category: string;
  incident_date: string;
  submission_date: string;
  investigator?: string;
  priority: string;
  status: string;
  evidence_count: number;
};

const ClaimsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchClaims = async () => {
    const token = localStorage.getItem('access_token');
    const params: any = {
      skip: page * rowsPerPage,
      limit: rowsPerPage,
    };
    if (statusFilter) params.status_filter = statusFilter;
    if (priorityFilter) params.priority_filter = priorityFilter;
    if (search) params.search = search; // backend currently doesn't support, but kept for future
    try {
      const resp = await axios.get('/api/claims', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setClaims(resp.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, priorityFilter, search]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openClaim = (id: string) => {
    navigate(`/claims/${id}`);
  };

  return (
    <Paper className="p-4 bg-card">
      <h2 className="text-2xl font-bold mb-4">{t('menu.claims')}</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <FormControl variant="outlined" size="small" className="w-48">
          <InputLabel>{t('filter.status') ?? 'Status'}</InputLabel>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as string)}
            label={t('filter.status') ?? 'Status'}
          >
            <MenuItem value=""><em>{t('filter.all') ?? 'All'}</em></MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="pending_review">Pending Review</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" className="w-48">
          <InputLabel>{t('filter.priority') ?? 'Priority'}</InputLabel>
          <Select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as string)}
            label={t('filter.priority') ?? 'Priority'}
          >
            <MenuItem value=""><em>{t('filter.all') ?? 'All'}</em></MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <TextField
          variant="outlined"
          size="small"
          placeholder={t('search.placeholder') ?? 'Search...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('table.claimId') ?? 'Claim ID'}</TableCell>
              <TableCell>{t('table.claimant') ?? 'Claimant'}</TableCell>
              <TableCell>{t('table.category') ?? 'Category'}</TableCell>
              <TableCell>{t('table.incidentDate') ?? 'Incident'}</TableCell>
              <TableCell>{t('table.submissionDate') ?? 'Submitted'}</TableCell>
              <TableCell>{t('table.priority') ?? 'Priority'}</TableCell>
              <TableCell>{t('table.status') ?? 'Status'}</TableCell>
              <TableCell>{t('table.evidence') ?? 'Evidence'} </TableCell>
              <TableCell align="right">{t('action.view') ?? 'View'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map(claim => (
              <TableRow key={claim.id} hover>
                <TableCell>{claim.claim_number}</TableCell>
                <TableCell>{claim.claimant}</TableCell>
                <TableCell>{claim.category}</TableCell>
                <TableCell>{claim.incident_date?.split('T')[0]}</TableCell>
                <TableCell>{claim.submission_date?.split('T')[0]}</TableCell>
                <TableCell>{claim.priority}</TableCell>
                <TableCell>{claim.status}</TableCell>
                <TableCell>{claim.evidence_count}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openClaim(claim.id)} size="small" aria-label={t('action.view') ?? 'View'}>
                    <ArrowForward size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={-1} // unknown total – using -1 disables page count display
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('pagination.rowsPerPage') ?? 'Rows per page'}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />
    </Paper>
  );
};

export default ClaimsList;

