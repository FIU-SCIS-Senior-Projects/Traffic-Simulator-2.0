cpdef filter_out_above(size_t max_i, float[:] vals, float r):
    nbhd = []

    cdef float t
    for i in range(max_i):
        t = vals[i]
        if t <= r:
            nbhd.append(i)

    return nbhd
